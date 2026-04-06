import { formatToDollars } from '@core/formatting';
import { ValidationError } from '@core/validation';
import { Client } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import {
  InvoiceDocumentType,
  InvoiceEntity,
} from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailSendResponse,
  EmailService,
  EmailTemplateMessage,
} from '../services';

@Injectable()
export class InvoiceShareEmail {
  private logger = new Logger(InvoiceShareEmail.name);

  constructor(
    private featureFlagResolver: FeatureFlagResolver,
    private emailService: EmailService,
  ) {}

  async send({
    emails,
    invoice,
    client,
  }: {
    emails: string[];
    client: Client;
    invoice: InvoiceEntity;
  }): Promise<null | EmailSendResponse> {
    if (this.featureFlagResolver.isDisabled(FeatureFlag.InvoiceEmails)) {
      this.logger.debug('Invoice emails are disabled. Skipping email send.');
      return null;
    }

    const document = invoice.documents.find(
      (document) => document.type === InvoiceDocumentType.Generated,
    );
    if (!document) {
      throw new ValidationError(
        'invoice-share',
        'Could not find document for invoice',
      );
    }

    const message: EmailTemplateMessage = {
      subject: `[Bobtail Invoice] Load #: ${invoice.loadNumber}`,
      s3: { key: 'invoice-email.hbs' },
      placeholders: {
        loadNumber: invoice.loadNumber,
        clientName: client.name,
        invoiceAmount: formatToDollars(invoice.accountsReceivableValue),
      },
    };

    const attachment = await this.emailService.urlAsAttachment(
      document.internalUrl,
    );
    return await this.emailService.sendTemplate({
      destination: {
        to: emails,
      },
      message,
      attachments: [attachment],
    });
  }
}
