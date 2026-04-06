import { ChangeActions, ChangeActor } from '@common';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceEntity, InvoiceRepository } from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { DeleteInvoiceActivityCommand } from '../../delete-invoice-activity.command';
import { Note } from '@core/data';
import { InvoiceEntityUtil } from '@module-persistence/util';

@CommandHandler(DeleteInvoiceActivityCommand)
export class DeleteInvoiceActivityCommandHandler
  implements BasicCommandHandler<DeleteInvoiceActivityCommand>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute(command: DeleteInvoiceActivityCommand): Promise<void> {
    const invoice = await this.invoiceRepository.getOneById(command.invoiceId);
    const invoiceActivityId = await this.resolveActivityLogId(command, invoice);
    await this.invoiceChangeActionsExecutor.apply(
      invoice,
      ChangeActions.deleteTagActivity(
        invoiceActivityId,
        command.request.note ? Note.fromText(command.request.note) : null,
        {
          actor: ChangeActor.User,
        },
      ),
    );
  }

  private async resolveActivityLogId(
    command: DeleteInvoiceActivityCommand,
    invoice: InvoiceEntity,
  ): Promise<string> {
    const { activityId, request } = command;

    // if not found and we have an activity key, try to find by v2 tag
    let activityLog = await InvoiceEntityUtil.findActivityLogByActivityId(
      invoice,
      activityId,
    );

    if (!activityLog && request.key) {
      activityLog = await InvoiceEntityUtil.findActivityLogByTagDefinitionKey(
        invoice,
        request.key,
      );
    }
    return activityLog?.id ?? activityId;
  }
}
