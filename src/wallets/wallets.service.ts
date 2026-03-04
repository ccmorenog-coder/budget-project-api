import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, WalletTransactionType } from '@prisma/client';
import BigDecimal from 'decimal.js';
import { FieldCipherService } from '../common/crypto/field-cipher.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js';
import { UpdateWalletDto } from './dto/update-wallet.dto.js';

const GMF_TRIGGER_TYPES: WalletTransactionType[] = [
  WalletTransactionType.EXPENSE,
  WalletTransactionType.CASH_WITHDRAWAL,
  WalletTransactionType.TRANSFER_OUT,
];

const DBM_WARNING_THRESHOLD = new BigDecimal('0.8');

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: FieldCipherService,
  ) {}

  async create(userId: string, dto: CreateWalletDto) {
    return this.prisma.wallet.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        accountNumber: dto.accountNumber,
        bankName: dto.bankName,
        isGmfExempt: dto.isGmfExempt ?? false,
        isLowValueDeposit: dto.isLowValueDeposit ?? false,
        currentBalance: this.cipher.encrypt('0'),
        monthlyInflowUsed: this.cipher.encrypt('0'),
        monthlyOutflowUsed: this.cipher.encrypt('0'),
        gmfOutflowUsed: this.cipher.encrypt('0'),
        ...(dto.monthlyInflowLimitUvt !== undefined && {
          monthlyInflowLimitUvt: dto.monthlyInflowLimitUvt,
        }),
        ...(dto.monthlyOutflowLimitUvt !== undefined && {
          monthlyOutflowLimitUvt: dto.monthlyOutflowLimitUvt,
        }),
      },
    });
  }

  async findAll(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return wallets.map((w) => this.decryptWalletBalances(w));
  }

  async findOne(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId, isActive: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.decryptWalletBalances(wallet);
  }

  async update(userId: string, walletId: string, dto: UpdateWalletDto) {
    await this.assertOwnership(userId, walletId);
    const { monthlyInflowLimitUvt, monthlyOutflowLimitUvt, ...rest } = dto;
    return this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...rest,
        ...(monthlyInflowLimitUvt !== undefined && { monthlyInflowLimitUvt }),
        ...(monthlyOutflowLimitUvt !== undefined && { monthlyOutflowLimitUvt }),
      },
    });
  }

  async remove(userId: string, walletId: string) {
    await this.assertOwnership(userId, walletId);
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { isActive: false },
    });
  }

  async createTransaction(
    userId: string,
    walletId: string,
    dto: CreateTransactionDto,
  ) {
    const wallet = await this.assertOwnership(userId, walletId);

    if (
      dto.type === WalletTransactionType.CASH_WITHDRAWAL &&
      !dto.cashWithdrawalChannel
    ) {
      throw new BadRequestException(
        'cashWithdrawalChannel is required for CASH_WITHDRAWAL transactions',
      );
    }

    if (
      dto.type === WalletTransactionType.TRANSFER_OUT &&
      !dto.destinationWalletId
    ) {
      throw new BadRequestException(
        'destinationWalletId is required for TRANSFER_OUT transactions',
      );
    }

    const amount: InstanceType<typeof BigDecimal> = new BigDecimal(dto.amount);
    const encryptedAmount = this.cipher.encrypt(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      const mainTx = await tx.walletTransaction.create({
        data: {
          walletId,
          type: dto.type,
          amount: encryptedAmount,
          description: dto.description,
          effectiveDate: new Date(dto.effectiveDate),
          destinationWalletId: dto.destinationWalletId,
          cashWithdrawalChannel: dto.cashWithdrawalChannel,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType,
          gmfApplied: false,
        },
      });

      let gmfTx: typeof mainTx | null = null;
      let gmfAmount = new BigDecimal(0);

      if (GMF_TRIGGER_TYPES.includes(dto.type) && !wallet.isGmfExempt) {
        const gmfRate = await this.getGmfRate(tx);
        gmfAmount = amount.times(gmfRate);
        const encryptedGmfAmount = this.cipher.encrypt(gmfAmount.toFixed(2));

        gmfTx = await tx.walletTransaction.create({
          data: {
            walletId,
            type: WalletTransactionType.GMF_TX,
            amount: encryptedGmfAmount,
            description: `GMF on ${dto.type}`,
            effectiveDate: new Date(dto.effectiveDate),
            linkedTxId: mainTx.id,
            gmfApplied: true,
            gmfAmount: encryptedGmfAmount,
          },
        });

        await tx.walletTransaction.update({
          where: { id: mainTx.id },
          data: { gmfApplied: true, gmfAmount: encryptedGmfAmount },
        });
      }

      const totalDebit = amount.plus(gmfAmount);
      await this.updateBalances(tx, wallet, dto.type, amount, totalDebit);

      await this.checkDbmLimits(tx, userId, walletId, wallet, dto.type, amount);

      return { transaction: mainTx, gmfTransaction: gmfTx };
    });
  }

  async findTransactions(
    userId: string,
    walletId: string,
    query: ListTransactionsQueryDto,
  ) {
    await this.assertOwnership(userId, walletId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      walletId,
      ...(query.type && { type: query.type }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { effectiveDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data: items.map((t) => ({
        ...t,
        amount: this.cipher.decryptSafe(t.amount),
        gmfAmount: t.gmfAmount ? this.cipher.decryptSafe(t.gmfAmount) : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async resetDbmCounters(): Promise<void> {
    const wallets = await this.prisma.wallet.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const zero = this.cipher.encrypt('0');

    await this.prisma.wallet.updateMany({
      where: { id: { in: wallets.map((w) => w.id) }, isActive: true },
      data: {
        monthlyInflowUsed: zero,
        monthlyOutflowUsed: zero,
        gmfOutflowUsed: zero,
        resetDate: new Date(),
      },
    });
  }

  private async assertOwnership(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId, isActive: true },
    });
    if (!wallet)
      throw new ForbiddenException('Wallet not found or access denied');
    return wallet;
  }

  private decryptWalletBalances(wallet: Record<string, unknown>) {
    return {
      ...wallet,
      currentBalance: this.cipher.decryptSafe(wallet.currentBalance as string),
      monthlyInflowUsed: this.cipher.decryptSafe(
        wallet.monthlyInflowUsed as string,
      ),
      monthlyOutflowUsed: this.cipher.decryptSafe(
        wallet.monthlyOutflowUsed as string,
      ),
      gmfOutflowUsed: this.cipher.decryptSafe(wallet.gmfOutflowUsed as string),
    };
  }

  private async getGmfRate(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<InstanceType<typeof BigDecimal>> {
    const param = await tx.fiscalParameter.findFirst({
      where: { key: 'GMF_RATE' },
      orderBy: { year: 'desc' },
    });
    if (!param?.valuePesos) {
      throw new BadRequestException(
        'GMF_RATE not configured in fiscal_parameters',
      );
    }
    return new BigDecimal(param.valuePesos.toString());
  }

  private async updateBalances(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    wallet: Awaited<ReturnType<typeof this.prisma.wallet.findFirst>> & object,
    type: WalletTransactionType,
    amount: InstanceType<typeof BigDecimal>, // Decimal instance
    totalDebit: InstanceType<typeof BigDecimal>, // Decimal instance
  ): Promise<void> {
    const currentBalance = new BigDecimal(
      this.cipher.decryptSafe(wallet.currentBalance),
    );
    const monthlyInflowUsed = new BigDecimal(
      this.cipher.decryptSafe(wallet.monthlyInflowUsed),
    );
    const monthlyOutflowUsed = new BigDecimal(
      this.cipher.decryptSafe(wallet.monthlyOutflowUsed),
    );
    const gmfOutflowUsed = new BigDecimal(
      this.cipher.decryptSafe(wallet.gmfOutflowUsed),
    );

    const isInflow =
      type === WalletTransactionType.INCOME ||
      type === WalletTransactionType.TRANSFER_IN ||
      type === WalletTransactionType.CASH_DEPOSIT ||
      type === WalletTransactionType.INVESTMENT_IN;

    const isOutflow =
      type === WalletTransactionType.EXPENSE ||
      type === WalletTransactionType.CASH_WITHDRAWAL ||
      type === WalletTransactionType.TRANSFER_OUT ||
      type === WalletTransactionType.INVESTMENT_OUT;

    const newBalance = isInflow
      ? currentBalance.plus(amount)
      : isOutflow
        ? currentBalance.minus(totalDebit)
        : currentBalance;

    const newInflowUsed = isInflow
      ? monthlyInflowUsed.plus(amount)
      : monthlyInflowUsed;

    const gmfDelta = totalDebit.minus(amount);
    const newOutflowUsed = isOutflow
      ? monthlyOutflowUsed.plus(amount)
      : monthlyOutflowUsed;

    const newGmfOutflowUsed = isOutflow
      ? gmfOutflowUsed.plus(gmfDelta)
      : gmfOutflowUsed;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        currentBalance: this.cipher.encrypt(newBalance.toFixed(2)),
        monthlyInflowUsed: this.cipher.encrypt(newInflowUsed.toFixed(2)),
        monthlyOutflowUsed: this.cipher.encrypt(newOutflowUsed.toFixed(2)),
        gmfOutflowUsed: this.cipher.encrypt(newGmfOutflowUsed.toFixed(2)),
      },
    });
  }

  private async checkDbmLimits(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    userId: string,
    walletId: string,
    wallet: Awaited<ReturnType<typeof this.prisma.wallet.findFirst>> & object,
    type: WalletTransactionType,
    amount: InstanceType<typeof BigDecimal>, // Decimal instance
  ): Promise<void> {
    if (!wallet.isLowValueDeposit) return;

    const uvtParam = await tx.fiscalParameter.findFirst({
      where: { key: 'UVT' },
      orderBy: { year: 'desc' },
    });
    if (!uvtParam?.valuePesos) return;

    const uvtValue = new BigDecimal(uvtParam.valuePesos.toString());

    const isInflow =
      type === WalletTransactionType.INCOME ||
      type === WalletTransactionType.TRANSFER_IN ||
      type === WalletTransactionType.CASH_DEPOSIT;

    const isOutflow =
      type === WalletTransactionType.EXPENSE ||
      type === WalletTransactionType.CASH_WITHDRAWAL ||
      type === WalletTransactionType.TRANSFER_OUT;

    if (isInflow) {
      const limitPesos = new BigDecimal(
        wallet.monthlyInflowLimitUvt.toString(),
      ).times(uvtValue);
      const used = new BigDecimal(
        this.cipher.decryptSafe(wallet.monthlyInflowUsed),
      ).plus(amount);
      await this.emitDbmNotification(
        tx,
        userId,
        walletId,
        used,
        limitPesos,
        'inflow',
      );
    }

    if (isOutflow) {
      const limitOutPesos = new BigDecimal(
        wallet.monthlyOutflowLimitUvt.toString(),
      ).times(uvtValue);
      const used = new BigDecimal(
        this.cipher.decryptSafe(wallet.monthlyOutflowUsed),
      ).plus(amount);
      await this.emitDbmNotification(
        tx,
        userId,
        walletId,
        used,
        limitOutPesos,
        'outflow',
      );
    }
  }

  private async emitDbmNotification(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    userId: string,
    walletId: string,
    used: InstanceType<typeof BigDecimal>, // Decimal instance
    limit: InstanceType<typeof BigDecimal>, // Decimal instance
    direction: 'inflow' | 'outflow',
  ): Promise<void> {
    const ratio = used.div(limit);
    if (ratio.lt(DBM_WARNING_THRESHOLD)) return;

    const type: NotificationType =
      direction === 'inflow'
        ? NotificationType.DBM_INFLOW_WARNING
        : NotificationType.DBM_OUTFLOW_WARNING;

    const pct = ratio.times(100).toFixed(0);
    const body = ratio.gte(1)
      ? `DBM ${direction} limit reached (${pct}%). Transactions are still allowed.`
      : `DBM ${direction} limit at ${pct}%.`;

    await tx.notification.create({
      data: {
        userId,
        type,
        title: `DBM ${direction} warning`,
        body,
        channel: 'IN_APP',
      },
    });
  }
}
