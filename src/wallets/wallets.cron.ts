import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WalletsService } from './wallets.service.js';

@Injectable()
export class WalletsCron {
  private readonly logger = new Logger(WalletsCron.name);

  constructor(private readonly walletsService: WalletsService) {}

  @Cron('0 0 1 * *', { name: 'dbm-monthly-reset', timeZone: 'America/Bogota' })
  async handleDbmMonthlyReset(): Promise<void> {
    this.logger.log('DBM monthly reset started');
    await this.walletsService.resetDbmCounters();
    this.logger.log('DBM monthly reset completed');
  }
}
