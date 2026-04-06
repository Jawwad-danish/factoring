import { BobtailConfigModule } from '@module-config';
import { DatabaseModule } from '@module-database';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigServiceHealthIndicator } from './config-service-health-indicator';
import { DatabaseHealthIndicator } from './database-health-indicator';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule, BobtailConfigModule, DatabaseModule],
  controllers: [HealthController],
  providers: [ConfigServiceHealthIndicator, DatabaseHealthIndicator],
})
export class HealthModule {}
