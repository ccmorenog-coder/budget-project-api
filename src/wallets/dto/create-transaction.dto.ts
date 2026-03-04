import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashWithdrawalChannel, WalletTransactionType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export class CreateTransactionDto {
  @ApiProperty({ enum: WalletTransactionType })
  @IsEnum(WalletTransactionType)
  type: WalletTransactionType;

  @ApiProperty({
    example: '50000.00',
    description: 'Amount in pesos (will be encrypted at rest)',
  })
  @IsString()
  @Matches(AMOUNT_REGEX, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  amount: string;

  @ApiPropertyOptional({ example: 'Pago mercado' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional({
    description: 'Destination wallet ID for TRANSFER_OUT',
  })
  @IsOptional()
  @IsUUID()
  destinationWalletId?: string;

  @ApiPropertyOptional({
    enum: CashWithdrawalChannel,
    description: 'Required when type is CASH_WITHDRAWAL',
  })
  @IsOptional()
  @IsEnum(CashWithdrawalChannel)
  cashWithdrawalChannel?: CashWithdrawalChannel;

  @ApiPropertyOptional({
    description: 'Reference entity ID (expense, loan, etc.)',
  })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({
    example: 'Expense',
    description: 'Type name of the referenced entity',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;
}
