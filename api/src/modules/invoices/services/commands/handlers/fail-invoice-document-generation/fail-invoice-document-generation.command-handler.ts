import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { FailInvoiceDocumentGenerationCommand } from '../../fail-invoice-document-generation.command';

@CommandHandler(FailInvoiceDocumentGenerationCommand)
export class FailInvoiceDocumentGenerationCommandHandler
  implements BasicCommandHandler<FailInvoiceDocumentGenerationCommand>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute(
    command: FailInvoiceDocumentGenerationCommand,
  ): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepository.getOneById(command.invoiceId);
    await this.invoiceChangeActionsExecutor.apply(
      invoice,
      ChangeActions.addTagAndActivity(
        TagDefinitionKey.INVOICE_PDF_FAILURE,
        Note.fromText('Invoice document generation failed'),
      ).concat(
        ChangeActions.deleteTag(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS, {
          optional: true,
        }),
      ),
    );
    return invoice;
  }
}
