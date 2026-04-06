import { Client } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailSendResponse,
  EmailService,
  EmailTemplateMessage,
} from '../services';

@Injectable()
export class ClientToActiveEmail {
  private logger = new Logger(ClientToActiveEmail.name);

  constructor(
    private featureFlagResolver: FeatureFlagResolver,
    private emailService: EmailService,
  ) {}

  async send(client: Client): Promise<null | EmailSendResponse> {
    if (this.featureFlagResolver.isDisabled(FeatureFlag.InvoiceEmails)) {
      this.logger.debug('Invoice emails are disabled. Skipping email send.');
      return null;
    }

    const message: EmailTemplateMessage = {
      subject: `You Bobtail account has been made Active`,
      s3: { key: 'client-to-active-from-on-hold-status.hbs' },
      placeholders: {
        clientName: client.name,
      },
    };

    return await this.emailService.sendTemplate({
      destination: {
        to: client.email,
      },
      message,
    });
  }
}
