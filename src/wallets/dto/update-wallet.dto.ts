import { PartialType } from '@nestjs/swagger';
import { CreateWalletDto } from './create-wallet.dto.js';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {}
