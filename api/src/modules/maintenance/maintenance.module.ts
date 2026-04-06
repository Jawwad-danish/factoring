import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './services/maintenance.service';
import { PersistenceModule } from '@module-persistence';
import { CqrsModule } from '@module-cqrs';
import { UpdateMaintenanceModeCommandHandler } from './services/commands/handlers';
import { APP_GUARD } from '@nestjs/core';
import { MaintenanceGuard } from './guards';
import { MaintenanceMapper } from './data/mappers';
import { CommonModule } from '@module-common';

const commandHandlers = [UpdateMaintenanceModeCommandHandler];
@Module({
  imports: [PersistenceModule, CqrsModule, CommonModule],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    MaintenanceGuard,
    MaintenanceMapper,
    {
      provide: APP_GUARD,
      useExisting: MaintenanceGuard,
    },
    ...commandHandlers,
  ],
})
export class MaintenanceModule {}
