import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = await this.databaseService.isConnected();
    const indicator = this.healthIndicatorService.check('database');
    return isHealthy ? indicator.up() : indicator.down({});
  }
}
