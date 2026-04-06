import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { BrokerRating } from '@module-brokers';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { InvoiceRule } from './invoice-rule';

@Injectable()
export class LowBrokerCreditRatingTagRule<
  P extends CreateInvoiceRequest | UpdateInvoiceRequest | RevertInvoiceRequest,
> implements InvoiceRule<P>
{
  private logger = new Logger(LowBrokerCreditRatingTagRule.name);

  async run(context: CommandInvoiceContext<P>): Promise<ChangeActions> {
    const { broker, entity } = context;
    const invoiceTag = await InvoiceEntityUtil.findActiveTag(
      entity,
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
    );
    const lowCreditBroker = broker?.displayRating() === BrokerRating.F;
    if (invoiceTag && lowCreditBroker) {
      this.logger.debug('Invoice already has broker low credit rating tag', {
        loadNumber: entity.loadNumber,
        tag: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      });
      return ChangeActions.empty();
    }
    if (invoiceTag && (!lowCreditBroker || !broker)) {
      this.logger.debug('Removing broker not found tag from invoice', {
        loadNumber: entity.loadNumber,
        tag: TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      });
      this.logger.log(
        `Remove ${TagDefinitionKey.LOW_BROKER_CREDIT_RATING} tag from invoice load number ${entity.loadNumber}.`,
      );

      return ChangeActions.deleteTag(TagDefinitionKey.LOW_BROKER_CREDIT_RATING);
    }

    if (lowCreditBroker) {
      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
            {
              data: {
                broker: {
                  id: broker.id,
                  name: broker.legalName,
                  rating: broker.displayRating(),
                },
                invoice: {
                  status: entity.status,
                },
              },
              placeholders: {
                broker: broker.legalName,
                rating: broker.displayRating(),
              },
            },
          ),
        ),
      );
    }
    return ChangeActions.empty();
  }
}
