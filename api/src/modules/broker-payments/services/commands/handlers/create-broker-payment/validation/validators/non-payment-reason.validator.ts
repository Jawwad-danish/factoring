import { ValidationError } from '@core/validation';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  TagDefinitionEntity,
  TagDefinitionGroupKey,
  TagDefinitionRepository,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../../data';
import { BrokerPaymentValidator } from '../../../../../common';

@Injectable()
export class NonPaymentReasonValidator
  implements BrokerPaymentValidator<CreateBrokerPaymentRequest>
{
  private logger = new Logger(NonPaymentReasonValidator.name);

  constructor(
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly tagDefinitionRepository: TagDefinitionRepository,
  ) {}

  async validate({
    request,
  }: BrokerPaymentContext<CreateBrokerPaymentRequest>): Promise<void> {
    if (request.amount.eq(0) && request.tag?.key) {
      const key = request.tag.key;
      const tag = await this.tagDefinitionRepository.getByKey(key);
      const allowedTag = await this.isTagAllowed(tag);
      if (!allowedTag) {
        this.logger.error('Invalid non payment reason', {
          invoiceId: request.invoiceId,
          tag: key,
        });
        throw new ValidationError(
          'non-payment-reason',
          `Not allowed tag ${request.tag?.key} for a nonpayment broker for invoice id ${request.invoiceId}`,
        );
      }
    }
  }

  private async isTagAllowed(tag: TagDefinitionEntity): Promise<boolean> {
    return await this.invoiceChangeActionsExecutor.areTagsAssociatedWithGroups(
      [tag],
      [TagDefinitionGroupKey.NON_PAYMENT_REASONS],
    );
  }
}
