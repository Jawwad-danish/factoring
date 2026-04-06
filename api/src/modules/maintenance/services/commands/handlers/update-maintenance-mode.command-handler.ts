import { BasicCommandHandler } from '@module-cqrs';
import { UpdateMaintenanceModeCommand } from '../update-maintenance-mode.command';
import { MaintenanceEntity, MaintenanceRepository } from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';

@CommandHandler(UpdateMaintenanceModeCommand)
export class UpdateMaintenanceModeCommandHandler
  implements BasicCommandHandler<UpdateMaintenanceModeCommand>
{
  constructor(private readonly systemConfigRepository: MaintenanceRepository) {}

  async execute(
    command: UpdateMaintenanceModeCommand,
  ): Promise<MaintenanceEntity> {
    return await this.systemConfigRepository.updateMaintenance(
      command.request.isEnabled,
      command.request.message,
    );
  }
}
