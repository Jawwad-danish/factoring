import { ValidationError } from '@core/validation';
import { EmailDestination } from '@module-aws';
import { Broker, BrokerEmailType } from '@module-brokers';
import { Client, ClientDocumentType } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailConfiguration,
  EmailSendResponse,
  EmailService,
  EmailTemplateMessage,
} from '../services';

@Injectable()
export class NoticeOfAssignmentEmail {
  private logger = new Logger(NoticeOfAssignmentEmail.name);

  constructor(
    private featureFlagResolver: FeatureFlagResolver,
    private emailService: EmailService,
    private emailConfig: EmailConfiguration,
  ) {}

  async send({
    client,
    broker,
    to,
  }: {
    client: Client;
    broker: Broker;
    to?: string;
  }): Promise<null | EmailSendResponse> {
    if (this.featureFlagResolver.isDisabled(FeatureFlag.InvoiceEmails)) {
      this.logger.debug('Invoice emails are disabled. Skipping email send.');
      return null;
    }

    let recipientEmails: string[];

    if (to) {
      recipientEmails = [to];
    } else {
      const brokerNOAEmails = broker.emails.filter(
        (email) => email.type === BrokerEmailType.NOA,
      );

      if (brokerNOAEmails.length === 0) {
        throw new ValidationError(
          'noa-email',
          'Broker does not have active NOA emails.',
        );
      }

      recipientEmails = brokerNOAEmails.map((email) => email.email);
    }

    const destination: EmailDestination = {
      to: recipientEmails,
      cc: client.factoringConfig.ccInEmails ? client.email : undefined,
    };
    return await this.sendNoaEmail(client, destination);
  }

  async sendBomb({
    client,
    brokers,
  }: {
    client: Client;
    brokers: Broker[];
  }): Promise<void> {
    if (this.featureFlagResolver.isDisabled(FeatureFlag.InvoiceEmails)) {
      this.logger.debug(
        'Invoice emails are disabled. Skipping noa bomb email send.',
      );
      return;
    }

    const allRecipientEmails: Set<string> = new Set();
    for (const broker of brokers) {
      const brokerNOAEmails = broker.emails.filter(
        (email) => email.type === BrokerEmailType.NOA,
      );
      if (brokerNOAEmails.length === 0) {
        throw new ValidationError(
          'noa-email',
          `Broker ${broker.id} does not have active NOA emails.`,
        );
      }
      brokerNOAEmails.forEach((email) => allRecipientEmails.add(email.email));
    }

    const destination: EmailDestination = {
      to: '',
      cc: client.factoringConfig.ccInEmails ? client.email : '',
      bcc: Array.from(allRecipientEmails),
    };
    await this.sendNoaEmail(client, destination);
  }

  private async sendNoaEmail(
    client: Client,
    destination: EmailDestination,
  ): Promise<null | EmailSendResponse> {
    const clientNOAAssignment = client.documents.filter(
      (doc) => doc.type === ClientDocumentType.NOTICE_OF_ASSIGNMENT,
    );

    if (clientNOAAssignment.length === 0) {
      throw new ValidationError(
        'noa-documents',
        'Client does not have NOA documents.',
      );
    }

    const attachments: any = [];
    for (const assignment of clientNOAAssignment) {
      const attachment = await this.emailService.urlAsAttachment(
        assignment.externalUrl,
      );
      attachments.push(attachment);
    }
    const message: EmailTemplateMessage = {
      subject: `[Bobtail] ${client.name} Assignment Letter`,
      s3: { key: 'noaEmail.hbs' },
      placeholders: {
        client,
      },
    };
    return await this.emailService.sendTemplate({
      from: this.emailConfig.getNoticeOfAssignmentOrigin(),
      destination,
      message,
      attachments,
    });
  }
}
