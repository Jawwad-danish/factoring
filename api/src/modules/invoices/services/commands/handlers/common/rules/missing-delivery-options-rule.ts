import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRule } from './invoice-rule';

@Injectable()
export class MissingDeliveryOptionsRule<
  P extends CreateInvoiceRequest | UpdateInvoiceRequest | RevertInvoiceRequest,
> implements InvoiceRule<P>
{
  private logger = new Logger(MissingDeliveryOptionsRule.name);

  async run(context: CommandInvoiceContext<P>): Promise<ChangeActions> {
    const { broker, entity } = context;
    const invoiceTag = await InvoiceEntityUtil.findActiveTag(
      entity,
      TagDefinitionKey.BROKER_INFORMATION_MISSING,
    );
    const brokerTags = broker?.tags.map((tag) => tag.key);
    const missingDeliveryOptions =
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_COPIES) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_EMAIL) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_FAX) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_ONLINE_SUBMIT) &&
      !brokerTags?.includes(TagDefinitionKey.BROKER_REQUIRE_ORIGINALS);

    if (invoiceTag && missingDeliveryOptions) {
      this.logger.debug('Invoice already has broker information missing tag', {
        loadNumber: entity.loadNumber,
        tag: TagDefinitionKey.BROKER_INFORMATION_MISSING,
      });
      return ChangeActions.empty();
    }

    if (invoiceTag && (!missingDeliveryOptions || !broker)) {
      return ChangeActions.deleteTag(
        TagDefinitionKey.BROKER_INFORMATION_MISSING,
      );
    }

    if (missingDeliveryOptions && broker) {
      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.BROKER_INFORMATION_MISSING,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.BROKER_INFORMATION_MISSING,
            {
              placeholders: {
                broker: broker.legalName,
              },
              data: {
                broker: {
                  id: broker.id,
                  name: broker.legalName,
                },
              },
            },
          ),
        ),
      );
    }
    return ChangeActions.empty();
  }
}
