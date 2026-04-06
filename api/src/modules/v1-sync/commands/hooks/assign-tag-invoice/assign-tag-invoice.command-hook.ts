import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { AssignInvoiceActivityCommand } from '@module-invoices/commands';
import { TagDefinitionKey } from '@module-persistence';
import { BadRequestException } from '@nestjs/common';
import { get, isEmpty } from 'lodash';
import { V1Api } from '../../../api';
import {
  getOtherV1InvoiceUpdateFromActivityLog,
  getV1InvoiceUpdateFromActivityLog,
  getV1UpdateType,
} from '../../../data';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

@CommandHook(AssignInvoiceActivityCommand)
export class AssignTagInvoiceCommandHook extends V1SyncCommandHook<AssignInvoiceActivityCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: AssignInvoiceActivityCommand,
  ): Promise<void> {
    let payload = command.request.v1Payload;
    if (isEmpty(payload)) {
      payload = this.buildV1Payload(command);
    }
    if (
      command.options?.notifyExternalService &&
      command.request.key === TagDefinitionKey.NOTIFICATION
    ) {
      try {
        await this.v1Api.messageContacts(command.options.clientId, {
          id: command.options.clientId,
          subject: command.options.subject,
          message: command.options.message,
        });
      } catch (error) {
        this.logger.error(
          'Request to V1 failed for client notification',
          error,
        );
      }
    }
    await this.v1Api.assignTagInvoice({
      ...payload,
      id: command.request.id,
      invoice_id: command.invoiceId,
      keepOriginalID: true,
    });
  }

  private buildV1Payload(
    command: AssignInvoiceActivityCommand,
  ): Record<string, any> {
    const result = command.getResult();
    if (!result) {
      this.logger.warn('Could not find result');
      return {};
    }

    const assignChanges = result?.changeActions.actions.filter((change) =>
      change.isAssign(),
    );
    if (assignChanges.length === 0) {
      this.logger.warn('Could not find assign change');
      return {};
    }
    const targetChange = assignChanges[0];
    const targetActivity = result.invoice.activities.find(
      (activity) => activity.id === targetChange.activityId,
    );
    if (!targetActivity) {
      this.logger.warn(`Could not find activity ${targetChange.activityId}`);
      return {};
    }

    let v1UpdateType = getV1UpdateType(result.invoice);
    let v1UpdateStatus = getV1InvoiceUpdateFromActivityLog(
      targetActivity.tagDefinition.key,
    );
    if (
      targetActivity.tagDefinition.key === TagDefinitionKey.OTHER_INVOICE_ISSUE
    ) {
      v1UpdateStatus = getOtherV1InvoiceUpdateFromActivityLog(v1UpdateType);
    }

    if (!v1UpdateStatus) {
      throw new BadRequestException(
        `Could not find flag for tag ${targetActivity.tagDefinition.key}. Please add the mapping for this tag`,
      );
    }

    v1UpdateType =
      targetActivity.tagDefinition.key === TagDefinitionKey.NOTE
        ? 'note'
        : v1UpdateType;

    const basePayload: Record<string, any> = {
      talked_to: get(targetActivity.payload, 'contactPerson', undefined),
      talked_to_contact_method: get(
        targetActivity.payload,
        'contactType',
        undefined,
      ),
      notes: targetActivity.note,
      invoice_id: command.invoiceId,
      update_type: v1UpdateType,
      update_status: v1UpdateStatus,
      send_firebase_notification: true,
    };

    switch (targetActivity.tagDefinition.key) {
      case TagDefinitionKey.BROKER_PAYMENT_SCHEDULED:
        basePayload['issue date'] = get(
          targetActivity.payload,
          'paymentIssueDate',
          undefined,
        );

        basePayload.check_number_or_ach = get(
          targetActivity.payload,
          'checkNumberOrACH',
          undefined,
        );
        break;
      default:
        break;
    }

    return basePayload;
  }
}
