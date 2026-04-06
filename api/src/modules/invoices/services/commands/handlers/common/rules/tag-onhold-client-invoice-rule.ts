import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { CommandInvoiceContext } from '@module-invoices/data';
import {
  ClientFactoringStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRule } from './invoice-rule';

@Injectable()
export class TagOnholdClientInvoiceRule
  implements InvoiceRule<CreateInvoiceRequest>
{
  private logger = new Logger(TagOnholdClientInvoiceRule.name);

  constructor(
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
  ) {}

  async run(
    context: CommandInvoiceContext<CreateInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { client, entity } = context;
    const config =
      await this.clientFactoringConfigsRepository.findOneByClientId(client.id);

    if (config?.status === ClientFactoringStatus.Hold) {
      this.logger.debug('Tagging invoice with client on hold', {
        loadNumber: entity.loadNumber,
        client: {
          id: client.id,
          name: client.name,
        },
      });

      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.CLIENT_ON_HOLD,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(TagDefinitionKey.CLIENT_ON_HOLD, {
            placeholders: {
              client: client.name,
            },
            data: {
              clientId: client.id,
              clientName: client.name,
            },
          }),
        ),
      );
    }
    return ChangeActions.empty();
  }
}
