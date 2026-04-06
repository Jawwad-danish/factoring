import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { ValidationError } from '@core/validation';
import { ClientApi } from '@module-clients';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceShareEmail } from '@module-email';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  InvoiceRepository,
  InvoiceStatus,
  TagDefinitionKey,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { ShareInvoiceCommand } from '../../share-invoice.command';

@CommandHandler(ShareInvoiceCommand)
export class ShareInvoiceCommandHandler
  implements BasicCommandHandler<ShareInvoiceCommand>
{
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly clientApi: ClientApi,
    private readonly invoiceShareEmail: InvoiceShareEmail,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  async execute({ invoiceId, request }: ShareInvoiceCommand): Promise<void> {
    const invoice = await this.invoiceRepository.getOneById(invoiceId);
    if (invoice.status === InvoiceStatus.UnderReview) {
      throw new ValidationError(
        'invoice-share',
        'Only purchased and declined invoices can be shared',
      );
    }

    const client = await this.clientApi.getById(invoice.clientId);
    await this.invoiceChangeActionsExecutor.apply(
      invoice,
      ChangeActions.addActivity(
        TagDefinitionKey.EMAIL_SENT,
        Note.from({
          payload: ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.EMAIL_SENT,
            {
              data: {
                emails: request.emails,
              },
            },
          ),
          text: `Invoice email sent to ${request.emails}`,
        }),
      ),
    );
    await this.invoiceShareEmail.send({
      emails: request.emails,
      invoice,
      client,
    });
  }
}
