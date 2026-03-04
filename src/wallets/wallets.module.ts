import { Module } from '@nestjs/common';
import { WalletsCron } from './wallets.cron.js';
import { WalletsController } from './wallets.controller.js';
import { WalletsService } from './wallets.service.js';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService, WalletsCron],
})
export class WalletsModule {}
