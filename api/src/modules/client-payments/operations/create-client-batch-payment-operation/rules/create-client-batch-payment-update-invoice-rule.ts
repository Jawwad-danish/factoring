import { Assignment } from '@core/data';
import {
  ActivityLogEntity,
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentStatus,
  InvoiceEntity,
  PaymentType,
  TagDefinitionKey,
} from '@module-persistence/entities';
import {
  ClientBatchPaymentContext,
  ClientBatchPaymentRule,
  CreateClientBatchPaymentRequest,
} from '@module-client-payments';
import { TagDefinitionRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UpdateInvoiceRule
  implements ClientBatchPaymentRule<CreateClientBatchPaymentRequest>
{
  private logger = new Logger(UpdateInvoiceRule.name);
  constructor(
    private readonly tagDefinitionRepository: TagDefinitionRepository,
  ) {}

  async run(
    context: ClientBatchPaymentContext<CreateClientBatchPaymentRequest>,
  ): Promise<void> {
    const { invoiceList, entity, paymentExists } = context;
    if (!paymentExists) {
      if (invoiceList.length > 0) {
        for (const invoice of invoiceList) {
          if (entity.status === ClientBatchPaymentStatus.Done) {
            invoice.clientPaymentStatus = ClientPaymentStatus.Sent;
            invoice.expedited = entity.type === PaymentType.WIRE ? true : false;
            invoice.activities.add(
              await this.createInvoiceActivity(invoice, entity),
            );
          }
        }
      }
    } else {
      this.logger.log(
        `Skipping batch payment invoice updates. Reason: Invoice updates already done for existing payment.`,
      );
    }
  }

  private async createInvoiceActivity(
    invoice: InvoiceEntity,
    batchEntity: ClientBatchPaymentEntity,
  ): Promise<ActivityLogEntity> {
    const tagDefinition = await this.tagDefinitionRepository.getByKey(
      TagDefinitionKey.UPDATE_INVOICE,
    );

    const assignment = Assignment.assign(
      invoice,
      'clientPaymentStatus',
      ClientPaymentStatus.Sent,
    );
    const activityLog = new ActivityLogEntity();
    (activityLog.note = `Invoice paid to client via batch transfer with id ${batchEntity.id}`),
      (activityLog.payload = {
        ...assignment.getPayload(),
        batchId: batchEntity.id,
      });
    activityLog.tagDefinition = tagDefinition;
    activityLog.createdBy = batchEntity.createdBy;
    return activityLog;
  }
}
