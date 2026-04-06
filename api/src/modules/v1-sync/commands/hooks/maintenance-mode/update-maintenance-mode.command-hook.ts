import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { UpdateMaintenanceModeCommand } from '@module-maintenance';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { MaintenanceEntity } from '@module-persistence';

@CommandHook(UpdateMaintenanceModeCommand)
export class UpdateMaintenanceModeCommandHook extends V1SyncCommandHook<UpdateMaintenanceModeCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    _command: UpdateMaintenanceModeCommand,
    result: MaintenanceEntity,
  ): Promise<void> {
    const v1Payload = {
      maintenance_mode: result.isEnabled,
      maintenance_reason: result.message,
    };
    await this.v1Api.updateMaintenanceMode(v1Payload);
  }
}
