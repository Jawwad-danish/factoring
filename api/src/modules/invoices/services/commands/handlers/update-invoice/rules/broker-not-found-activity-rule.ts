import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable, Logger } from '@nestjs/common';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '../../../../../data';
import { InvoiceRule } from '../../common';

@Injectable()
export class UpdateInvoiceBrokerNotFoundActivityRule
  implements InvoiceRule<UpdateInvoiceRequest>
{
  private logger = new Logger(UpdateInvoiceBrokerNotFoundActivityRule.name);

  async run(
    context: CommandInvoiceContext<UpdateInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { broker, entity, payload } = context;
    const tag = await InvoiceEntityUtil.findActiveTag(
      entity,
      TagDefinitionKey.BROKER_NOT_FOUND,
    );

    if (tag && payload.brokerId == null) {
      this.logger.debug('Invoice already has broker not found tag', {
        loadNumber: entity.loadNumber,
        tag: TagDefinitionKey.BROKER_NOT_FOUND,
      });
      return ChangeActions.empty();
    }

    if (tag && payload.brokerId !== null) {
      return ChangeActions.deleteTag(TagDefinitionKey.BROKER_NOT_FOUND, {
        optional: true,
      });
    }

    if (broker !== null && payload.brokerId === null) {
      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.BROKER_NOT_FOUND,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(TagDefinitionKey.BROKER_NOT_FOUND, {
            placeholders: {
              loadNumber: entity.loadNumber,
            },
            data: {
              invoice: {
                loadNumber: entity.loadNumber,
                status: entity.status,
              },
            },
          }),
        ),
      );
    }
    return ChangeActions.empty();
  }
}
