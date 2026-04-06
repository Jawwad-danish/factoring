import {
  ClientBatchPaymentContext,
  ClientBatchPaymentRule,
  CreateClientBatchPaymentRequest,
} from '@module-client-payments';
import { ClientFactoringConfigsRepository } from '@module-persistence';
import {
  ClientBatchPaymentStatus,
  PaymentType,
} from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UpdateClientFactoringConfigRule
  implements ClientBatchPaymentRule<CreateClientBatchPaymentRequest>
{
  constructor(
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
  ) {}
  private logger = new Logger(UpdateClientFactoringConfigRule.name);

  async run(
    context: ClientBatchPaymentContext<CreateClientBatchPaymentRequest>,
  ): Promise<void> {
    const { paymentExists, entity, data } = context;

    if (paymentExists) {
      this.logger.log(
        `Skipping batch payment clients updates. Reason: Clients updates already done for existing payment.`,
      );
      return;
    }

    const clientIds = this.getClientIds(data);
    const clientsList =
      await this.clientFactoringConfigRepository.findByClientIds(clientIds);

    clientsList.forEach((client) => {
      if (entity.status === ClientBatchPaymentStatus.Done) {
        client.expediteTransferOnly = false;
        client.doneSubmittingInvoices = false;
      }
    });
  }

  private getClientIds(data: Record<string, any>): string[] {
    const clientIds: string[] = [];
    if (data.transfer_type === PaymentType.WIRE) {
      data.client_payments?.forEach((payment) =>
        clientIds.push(payment.client_id),
      );
    }
    return clientIds;
  }
}
