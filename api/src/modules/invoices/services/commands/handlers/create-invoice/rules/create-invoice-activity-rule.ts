import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { CommandInvoiceContext } from '../../../../../data';
import { InvoiceRule } from '../../common/rules';

@Injectable()
export class CreateInvoiceActivityRule
  implements InvoiceRule<CreateInvoiceRequest>
{
  async run({
    broker,
    client,
    entity,
  }: CommandInvoiceContext<CreateInvoiceRequest>): Promise<ChangeActions> {
    return ChangeActions.addActivity(
      TagDefinitionKey.CREATE_INVOICE,
      Note.fromPayload(
        ActivityLogPayloadBuilder.forKey(TagDefinitionKey.CREATE_INVOICE, {
          placeholders: {
            client: client.name,
            broker: broker == null ? `'Broker not found'` : broker.legalName,
            amount: formatToDollars(penniesToDollars(entity.value)),
          },
          data: {
            client: client.name,
            broker: broker?.legalName ?? '',
            amount: entity.value.toNumber(),
          },
        }),
      ),
    );
  }
}
