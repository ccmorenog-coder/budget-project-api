import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WalletType } from '@prisma/client';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ example: 'Bancolombia Ahorros' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: WalletType })
  @IsEnum(WalletType)
  type: WalletType;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Bancolombia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isGmfExempt?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLowValueDeposit?: boolean;

  @ApiPropertyOptional({
    example: '210.5',
    description: 'DBM monthly inflow limit in UVT',
  })
  @IsOptional()
  @IsDecimal()
  monthlyInflowLimitUvt?: string;

  @ApiPropertyOptional({
    example: '210.5',
    description: 'DBM monthly outflow limit in UVT',
  })
  @IsOptional()
  @IsDecimal()
  monthlyOutflowLimitUvt?: string;
}
