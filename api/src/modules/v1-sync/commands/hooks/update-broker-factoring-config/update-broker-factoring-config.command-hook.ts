import { UpdateBrokerFactoringConfigCommand } from '@module-brokers/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { BrokerFactoringConfigEntity } from '@module-persistence';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(UpdateBrokerFactoringConfigCommand)
export class UpdateBrokerFactoringConfigCommandHook extends V1SyncCommandHook<UpdateBrokerFactoringConfigCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: UpdateBrokerFactoringConfigCommand,
    result: BrokerFactoringConfigEntity,
  ): Promise<void> {
    const payload = this.buildV1Payload(command, result);
    await this.v1Api.updateBroker(result.brokerId, {
      ...payload,
    });
  }

  private buildV1Payload(
    { request }: UpdateBrokerFactoringConfigCommand,
    result: BrokerFactoringConfigEntity,
  ): Record<string, any> {
    const payload: Record<string, any> = {};
    payload.id = result.brokerId;
    if (request.limitAmount !== undefined) {
      payload.debtor_limit = request.limitAmount;
      if (request.limitNote) {
        payload.changelog_notes = request.limitNote;
      }
    }
    return payload;
  }
}
