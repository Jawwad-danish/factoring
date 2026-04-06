import { CauseAwareError } from '@core/errors';
import { CreateBrokerPaymentCommand } from '@module-broker-payments/commands';
import { FeatureFlagResolver } from '@module-common';
import { CommandHook } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import {
  BrokerPaymentEntity,
  BrokerPaymentType,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { V1Api, retryWithHandledTimeout } from '../../../api';
import { V1SyncCommandHook } from '../v1-sync.command-hook';

const tagBrokerPaymentsFlagsToV1Mappings: Partial<
  Record<TagDefinitionKey, string>
> = {
  BROKER_CLAIM_AGAINST_CLIENT: 'debtor claim',
  BROKER_PAID_CLIENT_DIRECTLY: 'paid to client',
  BROKER_PAID_PREVIOUS_FACTOR: 'broker paid previous factor',
  DOUBLED_BROKERED_LOAD: 'double brokered load',
  DUPLICATE_INVOICE: 'duplicate invoice',
  FILED_ON_BROKER_BOND: 'filed on bond',
  LOAD_NOT_DELIVERED: 'load not delivered',
  FRAUDULENT_DOCUMENTS: 'missing documents',
  OVER_90_DAYS: 'over 90 days',
};

@CommandHook(CreateBrokerPaymentCommand)
export class CreateBrokerPaymentCommandHook extends V1SyncCommandHook<CreateBrokerPaymentCommand> {
  constructor(
    featureFlagResolver: FeatureFlagResolver,
    databaseService: DatabaseService,
    private readonly v1Api: V1Api,
  ) {
    super(featureFlagResolver, databaseService);
  }

  protected async doAfterCommand(
    command: CreateBrokerPaymentCommand,
    result: BrokerPaymentEntity,
  ): Promise<void> {
    try {
      await retryWithHandledTimeout(async () => {
        const v1Payload = this.buildV1CreateBrokerPayment(command, result);
        await this.v1Api.createBrokerPayment({
          ...v1Payload,
          id: result.id,
          keepOriginalID: true,
        });
      });
    } catch (error) {
      this.handleCreateBrokerPaymentError(error);
    }
  }

  private handleCreateBrokerPaymentError(error: any): void {
    this.logger.error('Error while creating broker payment', error);
    throw new CauseAwareError('Error while creating broker payment', error);
  }

  private buildV1CreateBrokerPayment(
    command: CreateBrokerPaymentCommand,
    result: BrokerPaymentEntity,
  ): any {
    const { request } = command;

    return {
      invoice_id: result.invoice.id,
      amount: request.amount.toString(),
      batch_date: request.batchDate,
      check_number:
        request.checkNumber && request.type === BrokerPaymentType.Check
          ? request.checkNumber
          : null,
      transaction_type: request.type
        ? request.type === BrokerPaymentType.Ach
          ? 'ach'
          : 'lockbox'
        : undefined,
      update_status: this.getV1UpdateStatus(request.tag?.key),
      update_type: 'approved',
    };
  }

  private getV1UpdateStatus(tagKey?: TagDefinitionKey): string | null {
    if (!tagKey) return null;
    return tagBrokerPaymentsFlagsToV1Mappings[tagKey] ?? null;
  }
}
