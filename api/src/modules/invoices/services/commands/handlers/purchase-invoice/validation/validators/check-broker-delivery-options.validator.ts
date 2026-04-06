import { ValidationError } from '@core/validation';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

@Injectable()
export class CheckBrokerDeliveryOptionsValidator
  implements PurchaseInvoiceValidator
{
  constructor() {}

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { broker } = context;
    const brokerTags = broker?.tags.map((tag) => tag.key);
    const missingDeliveryOptions =
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_COPIES) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_EMAIL) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_FAX) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_ONLINE_SUBMIT) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_ORIGINALS);

    if (missingDeliveryOptions) {
      throw new ValidationError(
        'broker-missing-delivery-options',
        `Cannot purchase an invoice with a broker that has no delivery option`,
      );
    }
  }
}
