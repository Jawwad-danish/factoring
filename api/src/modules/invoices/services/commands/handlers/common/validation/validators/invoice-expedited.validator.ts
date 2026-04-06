import { formatToDollars } from '@core/formatting';
import { penniesToDollars, totalAmount } from '@core/formulas';
import { ValidationError } from '@core/validation';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { ExpediteConfigurer } from '@module-common';
import { Injectable, Logger } from '@nestjs/common';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '../../../../../../data';
import { InvoiceValidator } from '../invoice-validator';

@Injectable()
export class InvoiceExpeditedValidator<
  P extends CreateInvoiceRequest | UpdateInvoiceRequest,
> implements InvoiceValidator<P>
{
  private logger = new Logger(InvoiceExpeditedValidator.name);

  constructor(private readonly expediteConfigurer: ExpediteConfigurer) {}

  async validate(context: CommandInvoiceContext<P>): Promise<void> {
    const { entity, payload, client } = context;
    const wireMinimumValue = this.expediteConfigurer.expediteFee();
    const invoiceValue = totalAmount({
      lineHaulRate: payload.lineHaulRate || entity.lineHaulRate,
      lumper: payload.lumper || entity.lumper,
      detention: payload.detention || entity.detention,
      advance: payload.advance || entity.advance,
    });
    if (
      invoiceValue.lt(wireMinimumValue) &&
      (client.factoringConfig.expediteTransferOnly || payload.expedited)
    ) {
      this.logger.error(
        `Could not create/update invoice to expedited because total amount is less than ${formatToDollars(
          this.expediteConfigurer.expediteFee(),
        )}`,
        {
          loadNumber: entity.loadNumber,
          id: entity.id,
        },
      );
      throw new ValidationError(
        'expedited-minimum-amount',
        `Could not create/update invoice to expedited with load number ${
          payload.loadNumber
        } because the amount ${formatToDollars(
          penniesToDollars(invoiceValue),
        )} is less than ${formatToDollars(
          penniesToDollars(this.expediteConfigurer.expediteFee()),
        )}.`,
      );
    }
  }
}
