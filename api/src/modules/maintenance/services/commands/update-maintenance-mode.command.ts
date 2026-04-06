import { RequestCommand } from '@module-cqrs';
import { UpdateMaintenanceModeRequest } from '../../data';
import { MaintenanceEntity } from '@module-persistence/entities';

export class UpdateMaintenanceModeCommand extends RequestCommand<
  UpdateMaintenanceModeRequest,
  MaintenanceEntity
> {
  constructor(request: UpdateMaintenanceModeRequest) {
    super(request);
  }
}
