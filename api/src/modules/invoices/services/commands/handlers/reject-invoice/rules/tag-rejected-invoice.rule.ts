import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note, NoteOptions } from '@core/data';
import {
  CommandInvoiceContext,
  RejectInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { InvoiceRule } from '../../common';
import { TagDefinitionRepository } from '@module-persistence';

@Injectable()
export class TagRejectedInvoiceRule
  implements InvoiceRule<RejectInvoiceRequest>
{
  constructor(
    private readonly tagDefinitionRepository: TagDefinitionRepository,
  ) {}

  async run(
    context: CommandInvoiceContext<RejectInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { broker, payload, entity } = context;
    const tagDefinition = await this.tagDefinitionRepository.getByKey(
      payload.key,
    );
    const noteOptions: NoteOptions = {
      prefix: `Declined because: ${tagDefinition.name}.`,
    };
    let note = Note.from({
      text: payload?.note || 'Invoice tagged without additional notes',
      payload: {
        data: {
          invoice: {
            status: entity.status,
          },
        },
      },
      options: noteOptions,
    });
    if (payload.key === TagDefinitionKey.LOW_BROKER_CREDIT_RATING) {
      note = Note.from({
        options: noteOptions,
        payload: ActivityLogPayloadBuilder.forKey(
          TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
          {
            placeholders: {
              broker: broker?.legalName || 'Broker not found',
              rating: broker?.rating || 'Missing rating',
            },
            data: {
              broker: {
                id: broker?.id || '',
                name: broker?.legalName || '',
                rating: broker?.rating || '',
              },
              invoice: {
                status: entity.status,
              },
            },
          },
        ),
      });
    }

    return ChangeActions.addTagAndActivity(payload.key, note);
  }
}
