import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { VerifyInvoiceCommand } from '@module-invoices/commands';
import { V1Api } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';
import {
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { InvoiceContext } from '@module-invoices';
import { ValidationError } from '@core/validation';
import { BasicEntityUtil } from '@module-persistence/util';

@CommandHook(VerifyInvoiceCommand)
export class VerifyInvoiceCommandHook extends V1SyncCommandHook<VerifyInvoiceCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: VerifyInvoiceCommand,
    result: InvoiceContext,
  ): Promise<void> {
    switch (command.request.status) {
      case VerificationStatus.Bypassed:
        const bypassPayload = this.buildV1BypassVerificationPayload(result);
        await this.v1Api.verifyInvoice(command.invoiceId, bypassPayload);
        break;

      case VerificationStatus.InProgress:
        const inProgressPayload = this.buildV1WaitOnVerificationPayload(
          command,
          result,
        );
        await this.v1Api.waitOnVerificationInvoice(inProgressPayload);
        break;

      case VerificationStatus.Verified:
        const verifiedPayload = this.buildV1VerifiedPayload(command, result);
        await this.v1Api.verifyInvoice(command.invoiceId, {
          ...verifiedPayload,
        });
        break;

      default:
        throw new ValidationError(
          'unexpected-verification-status-v1',
          `Unexpected verification status for v1 update: ${command.request.status}`,
        );
    }
  }

  private buildV1VerifiedPayload(
    command: VerifyInvoiceCommand,
    result: InvoiceContext,
  ): any {
    {
      return {
        id: result.entity.id,
        notes: command.request.notes,
        requires_verification: false,
        talked_to: command.request.contactPerson,
        talked_to_contact_method: command.request.contactType,
        verified: 'verified',
      };
    }
  }

  private buildV1WaitOnVerificationPayload(
    command: VerifyInvoiceCommand,
    result: InvoiceContext,
  ): any {
    let payload: any = {
      invoice_id: result.entity.id,
      talked_to: command.request.contactPerson,
      talked_to_contact_method: command.request.contactType,
      notes: command.request.notes,
      update_status: 'waiting on verification',
      update_type: 'pending',
    };

    // We need to associate the ids of the update/activity in case we want to delete them later
    const sortedActivities = BasicEntityUtil.sortEntitiesDesc(
      result.entity.activities,
    );
    const targetActivity = sortedActivities.find(
      (activity) =>
        activity.tagDefinition.key ===
        TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION,
    );

    if (targetActivity) {
      payload = { ...payload, id: targetActivity.id, keepOriginalID: true };
    }

    return payload;
  }

  private buildV1BypassVerificationPayload(result: InvoiceContext): any {
    return {
      id: result.entity.id,
      requires_verification: false,
      skipped_verification: true, // Used to create a unique invoice update
    };
  }
}
