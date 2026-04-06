import { ChangeActions, ChangeActor } from '@common';
import { Note } from '@core/data';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  InvoiceRepository,
  RecordStatus,
  TagDefinitionKey,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { DeleteInvoiceCommand } from '../../delete-invoice.command';

@CommandHandler(DeleteInvoiceCommand)
export class DeleteInvoiceCommandHandler
  implements BasicCommandHandler<DeleteInvoiceCommand>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute(command: DeleteInvoiceCommand): Promise<void> {
    const invoice = await this.invoiceRepository.getOneById(command.invoiceId);
    invoice.recordStatus = RecordStatus.Inactive;
    await this.invoiceChangeActionsExecutor.apply(
      invoice,
      ChangeActions.addActivity(
        TagDefinitionKey.DELETE_INVOICE,
        Note.fromPayload({
          updatedBy: invoice.updatedBy,
        }),
        {
          actor: ChangeActor.User,
        },
      ),
    );
  }
}
