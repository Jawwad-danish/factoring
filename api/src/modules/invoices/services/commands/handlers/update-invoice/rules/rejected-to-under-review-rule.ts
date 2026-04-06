import { ChangeActions } from '@common';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRule } from '../../common';

@Injectable()
export class RejectedToUnderReviewRule
  implements InvoiceRule<UpdateInvoiceRequest>
{
  private logger = new Logger(RejectedToUnderReviewRule.name);
  async run(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity } = context;
    if (entity.status === InvoiceStatus.Rejected) {
      entity.status = InvoiceStatus.UnderReview;
      this.logger.debug('Invoice moved from rejected to under review', {
        invoice: {
          id: entity.id,
          loadNumber: entity.loadNumber,
        },
      });
    }
    return ChangeActions.empty();
  }
}
