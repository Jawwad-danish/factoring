import { CommandRunner } from '@module-cqrs';
import { MaintenanceEntity, MaintenanceRepository } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { UpdateMaintenanceModeRequest } from '../data';
import { UpdateMaintenanceModeCommand } from './commands';
import { Transactional } from '@module-database';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly repository: MaintenanceRepository,
  ) {}

  async get(): Promise<MaintenanceEntity> {
    return await this.repository.getMaintenance();
  }

  @Transactional('update-maintenance')
  async update(
    request: UpdateMaintenanceModeRequest,
  ): Promise<MaintenanceEntity> {
    return await this.commandRunner.run(
      new UpdateMaintenanceModeCommand(request),
    );
  }
}
