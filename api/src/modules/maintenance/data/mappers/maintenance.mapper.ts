import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { MaintenanceEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { MaintenanceStatus } from '../maintenance.model';
@Injectable()
export class MaintenanceMapper
  implements DataMapper<MaintenanceEntity, MaintenanceStatus>
{
  constructor(private userMapper: UserMapper) {}

  async entityToModel(entity: MaintenanceEntity): Promise<MaintenanceStatus> {
    const maintenance = new MaintenanceStatus({
      isEnabled: entity.isEnabled,
      message: entity.message,
      createdAt: entity.createdAt,
      updatedAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedBy: await this.userMapper.updatedByToModel(entity),
    });

    return maintenance;
  }
}
