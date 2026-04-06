import { Public } from '@module-auth';
import { Controller, Get, Injectable } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ConfigServiceHealthIndicator } from './config-service-health-indicator';
import { DatabaseHealthIndicator } from './database-health-indicator';

@Public()
@Controller('health')
@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private configServiceHealthIndicator: ConfigServiceHealthIndicator,
    private databaseHealthIndicator: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.configServiceHealthIndicator.isHealthy(),
      () => this.databaseHealthIndicator.isHealthy(),
    ]);
  }
}
