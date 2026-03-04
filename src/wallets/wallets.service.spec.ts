import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletTransactionType, WalletType } from '@prisma/client';
import { FieldCipherService } from '../common/crypto/field-cipher.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js';
import { WalletsService } from './wallets.service.js';

const ENCRYPTED_ZERO = 'enc:0';
const ENCRYPTED_AMOUNT = 'enc:50000';

const mockCipher = {
  encrypt: jest.fn().mockReturnValue(ENCRYPTED_ZERO),
  decrypt: jest.fn().mockReturnValue('0'),
  encryptIfValue: jest.fn().mockReturnValue(ENCRYPTED_ZERO),
  decryptSafe: jest.fn().mockReturnValue('0'),
};

const baseWallet = {
  id: 'wallet-uuid',
  userId: 'user-uuid',
  name: 'Test Wallet',
  type: WalletType.BANK,
  isGmfExempt: false,
  isLowValueDeposit: false,
  isActive: true,
  currentBalance: ENCRYPTED_ZERO,
  monthlyInflowUsed: ENCRYPTED_ZERO,
  monthlyOutflowUsed: ENCRYPTED_ZERO,
  gmfOutflowUsed: ENCRYPTED_ZERO,
  monthlyInflowLimitUvt: { toString: () => '210.5' },
  monthlyOutflowLimitUvt: { toString: () => '210.5' },
  gmfExemptLimitUvt: { toString: () => '65' },
  accountNumber: null,
  bankName: null,
  createdAt: new Date(),
  resetDate: null,
};

const mockTransaction = {
  id: 'tx-uuid',
  walletId: 'wallet-uuid',
  type: WalletTransactionType.EXPENSE,
  amount: ENCRYPTED_AMOUNT,
  description: 'Test',
  effectiveDate: new Date(),
  gmfApplied: false,
  gmfAmount: null,
  linkedTxId: null,
  destinationWalletId: null,
  cashWithdrawalChannel: null,
  referenceId: null,
  referenceType: null,
  createdAt: new Date(),
};

const mockTx = {
  wallet: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  walletTransaction: {
    create: jest.fn().mockResolvedValue(mockTransaction),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  fiscalParameter: {
    findFirst: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
};

const mockPrisma = {
  wallet: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  walletTransaction: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCipher.encrypt.mockReturnValue(ENCRYPTED_ZERO);
    mockCipher.decryptSafe.mockReturnValue('0');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FieldCipherService, useValue: mockCipher },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  describe('create', () => {
    it('should create a wallet with encrypted zero balances', async () => {
      const dto: CreateWalletDto = { name: 'My Bank', type: WalletType.BANK };
      mockPrisma.wallet.create.mockResolvedValue({
        ...baseWallet,
        name: 'My Bank',
      });

      const result = await service.create('user-uuid', dto);

      expect(mockCipher.encrypt).toHaveBeenCalledWith('0');
      expect(mockPrisma.wallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            userId: 'user-uuid',
            name: 'My Bank',
            type: WalletType.BANK,
            isGmfExempt: false,
            isLowValueDeposit: false,
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should default isGmfExempt and isLowValueDeposit to false', async () => {
      const dto: CreateWalletDto = { name: 'Cash', type: WalletType.CASH };
      mockPrisma.wallet.create.mockResolvedValue(baseWallet);

      await service.create('user-uuid', dto);

      expect(mockPrisma.wallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            isGmfExempt: false,
            isLowValueDeposit: false,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return decrypted wallet balances', async () => {
      mockPrisma.wallet.findMany.mockResolvedValue([baseWallet]);
      mockCipher.decryptSafe.mockReturnValue('1000');

      const result = await service.findAll('user-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].currentBalance).toBe('1000');
      expect(mockPrisma.wallet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid', isActive: true },
        }),
      );
    });

    it('should return empty array when no wallets', async () => {
      mockPrisma.wallet.findMany.mockResolvedValue([]);
      const result = await service.findAll('user-uuid');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return decrypted wallet', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(baseWallet);
      mockCipher.decryptSafe.mockReturnValue('5000');

      const result = await service.findOne('user-uuid', 'wallet-uuid');

      expect(result.currentBalance).toBe('5000');
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);
      await expect(service.findOne('user-uuid', 'wallet-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update wallet fields', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(baseWallet);
      mockPrisma.wallet.update.mockResolvedValue({
        ...baseWallet,
        name: 'Updated',
      });

      const result = await service.update('user-uuid', 'wallet-uuid', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw ForbiddenException when wallet not owned', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);
      await expect(
        service.update('user-uuid', 'wallet-uuid', { name: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete the wallet', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(baseWallet);
      mockPrisma.wallet.update.mockResolvedValue({
        ...baseWallet,
        isActive: false,
      });

      await service.remove('user-uuid', 'wallet-uuid');

      expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it('should throw ForbiddenException when wallet not owned', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);
      await expect(service.remove('user-uuid', 'wallet-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createTransaction', () => {
    const gmfRateParam = { key: 'GMF_RATE', valuePesos: 0.004 };

    beforeEach(() => {
      mockPrisma.wallet.findFirst.mockResolvedValue(baseWallet);
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
      );
      mockTx.wallet.findFirst.mockResolvedValue(baseWallet);
      mockTx.wallet.update.mockResolvedValue(baseWallet);
      mockTx.walletTransaction.create.mockResolvedValue(mockTransaction);
      mockTx.walletTransaction.update.mockResolvedValue(mockTransaction);
      mockTx.fiscalParameter.findFirst.mockResolvedValue(gmfRateParam);
      mockCipher.encrypt.mockReturnValue(ENCRYPTED_AMOUNT);
      mockCipher.decryptSafe.mockReturnValue('0');
    });

    it('should create EXPENSE transaction and auto-generate GMF_TX when not exempt', async () => {
      const dto: CreateTransactionDto = {
        type: WalletTransactionType.EXPENSE,
        amount: '50000',
        effectiveDate: '2026-03-01',
      };

      const result = await service.createTransaction(
        'user-uuid',
        'wallet-uuid',
        dto,
      );

      expect(mockTx.walletTransaction.create).toHaveBeenCalledTimes(2);
      expect(mockTx.walletTransaction.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ type: WalletTransactionType.GMF_TX }),
        }),
      );
      expect(result.gmfTransaction).toBeDefined();
    });

    it('should NOT create GMF_TX when wallet is gmf exempt', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue({
        ...baseWallet,
        isGmfExempt: true,
      });

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.EXPENSE,
        amount: '50000',
        effectiveDate: '2026-03-01',
      };

      const result = await service.createTransaction(
        'user-uuid',
        'wallet-uuid',
        dto,
      );

      expect(mockTx.walletTransaction.create).toHaveBeenCalledTimes(1);
      expect(result.gmfTransaction).toBeNull();
    });

    it('should NOT create GMF_TX for INCOME transactions', async () => {
      const dto: CreateTransactionDto = {
        type: WalletTransactionType.INCOME,
        amount: '100000',
        effectiveDate: '2026-03-01',
      };

      const result = await service.createTransaction(
        'user-uuid',
        'wallet-uuid',
        dto,
      );

      expect(mockTx.walletTransaction.create).toHaveBeenCalledTimes(1);
      expect(result.gmfTransaction).toBeNull();
    });

    it('should require cashWithdrawalChannel for CASH_WITHDRAWAL', async () => {
      const dto: CreateTransactionDto = {
        type: WalletTransactionType.CASH_WITHDRAWAL,
        amount: '50000',
        effectiveDate: '2026-03-01',
      };

      await expect(
        service.createTransaction('user-uuid', 'wallet-uuid', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require destinationWalletId for TRANSFER_OUT', async () => {
      const dto: CreateTransactionDto = {
        type: WalletTransactionType.TRANSFER_OUT,
        amount: '50000',
        effectiveDate: '2026-03-01',
      };

      await expect(
        service.createTransaction('user-uuid', 'wallet-uuid', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when wallet not owned', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.INCOME,
        amount: '1000',
        effectiveDate: '2026-03-01',
      };

      await expect(
        service.createTransaction('user-uuid', 'wallet-uuid', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when GMF_RATE not configured', async () => {
      mockTx.fiscalParameter.findFirst.mockResolvedValue(null);

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.EXPENSE,
        amount: '50000',
        effectiveDate: '2026-03-01',
      };

      await expect(
        service.createTransaction('user-uuid', 'wallet-uuid', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should trigger GMF_TX for CASH_WITHDRAWAL with channel', async () => {
      const dto: CreateTransactionDto = {
        type: WalletTransactionType.CASH_WITHDRAWAL,
        amount: '50000',
        effectiveDate: '2026-03-01',
        cashWithdrawalChannel: 'ATM' as never,
      };

      const result = await service.createTransaction(
        'user-uuid',
        'wallet-uuid',
        dto,
      );

      expect(result.gmfTransaction).toBeDefined();
    });

    it('should trigger GMF_TX for TRANSFER_OUT', async () => {
      const dto: CreateTransactionDto = {
        type: WalletTransactionType.TRANSFER_OUT,
        amount: '50000',
        effectiveDate: '2026-03-01',
        destinationWalletId: 'other-wallet-uuid',
      };

      const result = await service.createTransaction(
        'user-uuid',
        'wallet-uuid',
        dto,
      );

      expect(result.gmfTransaction).toBeDefined();
    });
  });

  describe('createTransaction — DBM notifications', () => {
    const uvtParam = { key: 'UVT', valuePesos: 47065 };
    const gmfRateParam = { key: 'GMF_RATE', valuePesos: 0.004 };

    beforeEach(() => {
      const dbmWallet = {
        ...baseWallet,
        isLowValueDeposit: true,
        isGmfExempt: true,
      };
      mockPrisma.wallet.findFirst.mockResolvedValue(dbmWallet);
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
      );
      mockTx.wallet.update.mockResolvedValue(dbmWallet);
      mockTx.walletTransaction.create.mockResolvedValue(mockTransaction);
      mockTx.walletTransaction.update.mockResolvedValue(mockTransaction);
      mockTx.fiscalParameter.findFirst.mockImplementation(
        ({ where }: { where: { key: string } }) => {
          if (where.key === 'GMF_RATE') return Promise.resolve(gmfRateParam);
          if (where.key === 'UVT') return Promise.resolve(uvtParam);
          return Promise.resolve(null);
        },
      );
      mockTx.notification.create.mockResolvedValue({});
    });

    it('should emit DBM_INFLOW_WARNING at 80% threshold', async () => {
      const limitPesos = 210.5 * 47065;
      const usedAt80 = (limitPesos * 0.8).toFixed(2);
      mockCipher.decryptSafe.mockReturnValue(usedAt80);

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.INCOME,
        amount: '1',
        effectiveDate: '2026-03-01',
      };

      await service.createTransaction('user-uuid', 'wallet-uuid', dto);

      expect(mockTx.notification.create).toHaveBeenCalled();
    });

    it('should NOT emit DBM notification below 80% threshold', async () => {
      mockCipher.decryptSafe.mockReturnValue('0');

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.INCOME,
        amount: '1',
        effectiveDate: '2026-03-01',
      };

      await service.createTransaction('user-uuid', 'wallet-uuid', dto);

      expect(mockTx.notification.create).not.toHaveBeenCalled();
    });

    it('should NOT emit DBM notification when UVT param missing', async () => {
      mockTx.fiscalParameter.findFirst.mockResolvedValue(null);

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.INCOME,
        amount: '1',
        effectiveDate: '2026-03-01',
      };

      await service.createTransaction('user-uuid', 'wallet-uuid', dto);

      expect(mockTx.notification.create).not.toHaveBeenCalled();
    });

    it('should emit DBM_OUTFLOW_WARNING at 80% threshold for EXPENSE', async () => {
      const limitPesos = 210.5 * 47065;
      const usedAt80 = (limitPesos * 0.8).toFixed(2);
      mockCipher.decryptSafe.mockReturnValue(usedAt80);

      const dto: CreateTransactionDto = {
        type: WalletTransactionType.EXPENSE,
        amount: '1',
        effectiveDate: '2026-03-01',
      };

      await service.createTransaction('user-uuid', 'wallet-uuid', dto);

      expect(mockTx.notification.create).toHaveBeenCalled();
    });
  });

  describe('findTransactions', () => {
    beforeEach(() => {
      mockPrisma.wallet.findFirst.mockResolvedValue(baseWallet);
      mockPrisma.$transaction.mockResolvedValue([[mockTransaction], 1]);
    });

    it('should return paginated transactions with decrypted amounts', async () => {
      mockCipher.decryptSafe.mockReturnValue('50000');

      const result = await service.findTransactions(
        'user-uuid',
        'wallet-uuid',
        {
          page: 1,
          limit: 20,
        },
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amount).toBe('50000');
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should apply type filter when provided', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findTransactions('user-uuid', 'wallet-uuid', {
        page: 1,
        limit: 20,
        type: WalletTransactionType.INCOME,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when wallet not owned', async () => {
      mockPrisma.wallet.findFirst.mockResolvedValue(null);

      await expect(
        service.findTransactions('user-uuid', 'wallet-uuid', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resetDbmCounters', () => {
    it('should reset all active wallet DBM counters to encrypted zero', async () => {
      mockPrisma.wallet.findMany.mockResolvedValue([
        { id: 'wallet-1' },
        { id: 'wallet-2' },
      ]);
      mockPrisma.wallet.updateMany.mockResolvedValue({ count: 2 });
      mockCipher.encrypt.mockReturnValue(ENCRYPTED_ZERO);

      await service.resetDbmCounters();

      expect(mockPrisma.wallet.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            monthlyInflowUsed: ENCRYPTED_ZERO,
            monthlyOutflowUsed: ENCRYPTED_ZERO,
            gmfOutflowUsed: ENCRYPTED_ZERO,
          }),
        }),
      );
    });

    it('should do nothing when no active wallets', async () => {
      mockPrisma.wallet.findMany.mockResolvedValue([]);
      mockPrisma.wallet.updateMany.mockResolvedValue({ count: 0 });

      await service.resetDbmCounters();

      expect(mockPrisma.wallet.updateMany).toHaveBeenCalled();
    });
  });
});
