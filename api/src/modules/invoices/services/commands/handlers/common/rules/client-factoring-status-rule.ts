import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import {
  ClientFactoringStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRule } from './invoice-rule';

@Injectable()
export class ClientFactoringStatusRule<
  P extends CreateInvoiceRequest | UpdateInvoiceRequest | RevertInvoiceRequest,
> implements InvoiceRule<P>
{
  private logger = new Logger(ClientFactoringStatusRule.name);

  async run(context: CommandInvoiceContext<P>): Promise<ChangeActions> {
    const { client } = context;
    if (client.factoringConfig.status !== ClientFactoringStatus.Active) {
      this.logger.debug(`Client factoring status is not active`, {
        id: client.id,
        name: client.name,
        status: client.factoringConfig.status,
      });

      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.CLIENT_STATUS_ISSUE,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.CLIENT_STATUS_ISSUE,
            {
              placeholders: {
                client: client.name,
                status: client.factoringConfig.status,
              },
              data: {
                clientId: client.id,
                clientName: client.name,
                clientStatus: client.factoringConfig.status,
              },
            },
          ),
        ),
      );
    }

    return ChangeActions.empty();
  }
}
