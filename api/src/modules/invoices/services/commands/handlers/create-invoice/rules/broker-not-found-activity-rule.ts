import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { CommandInvoiceContext } from '../../../../../data';
import { InvoiceRule } from '../../common';

@Injectable()
export class CreateInvoiceBrokerNotFoundActivityRule
  implements InvoiceRule<CreateInvoiceRequest>
{
  async run({
    entity,
    payload,
  }: CommandInvoiceContext<CreateInvoiceRequest>): Promise<ChangeActions> {
    if (payload.brokerId !== null) {
      return ChangeActions.empty();
    }

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
}
