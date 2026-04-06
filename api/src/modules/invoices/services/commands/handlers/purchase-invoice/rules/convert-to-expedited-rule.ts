import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '../../../../../data';

import { ChangeActions } from '@common';
import { Injectable, Logger } from '@nestjs/common';
import { PurchaseInvoiceRule } from './purchase-invoice-rule';

@Injectable()
export class ConvertToExpeditedRule implements PurchaseInvoiceRule {
  private logger: Logger = new Logger(ConvertToExpeditedRule.name);

  async run({
    entity,
    client,
  }: CommandInvoiceContext<PurchaseInvoiceRequest>): Promise<ChangeActions> {
    if (client.factoringConfig.expediteTransferOnly) {
      this.logger.warn(
        `Client ${client.id} is configured to only allow expedite transfers. Forcing payment type to expedited for invoice ${entity.id}`,
      );
      entity.expedited = true;
    }
    return ChangeActions.empty();
  }
}
