import { CommandHook } from '@module-cqrs';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { retryWithHandledTimeout, V1Api } from '../../../api';
import { CreateFirebaseTokenCommand } from '@module-firebase';

@CommandHook(CreateFirebaseTokenCommand)
export class CreateFirebaseTokenCommandHook extends V1SyncCommandHook<CreateFirebaseTokenCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateFirebaseTokenCommand,
  ): Promise<void> {
    const payload = this.buildV1Payload(command);
    await retryWithHandledTimeout(async () => {
      await this.v1Api.createFirebaseToken(payload);
    });
  }

  private buildV1Payload({
    request,
  }: CreateFirebaseTokenCommand): Record<string, any> {
    const payload: Record<string, any> = {};
    payload.firebase_token = request.firebaseDeviceToken;
    return payload;
  }
}
