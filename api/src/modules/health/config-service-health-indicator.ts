import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import {
  ConfigService,
  CONFIG_SERVICE,
} from '../bobtail-config/config.service';

@Injectable()
export class ConfigServiceHealthIndicator {
  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const isHealthy = this.configService.isLive();
    const indicator = this.healthIndicatorService.check('config');
    return isHealthy ? indicator.up() : indicator.down();
  }
}
