import { penniesToDollars } from '@core/formulas';
import { EmailDestination } from '@module-aws';
import { Broker, BrokerEmailType } from '@module-brokers';
import { Client } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { InvoiceEntity, TagDefinitionKey } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailSendResponse,
  EmailService,
  EmailTemplateMessage,
} from '../services';

@Injectable()
export class InvoicePurchaseEmail {
  private logger = new Logger(InvoicePurchaseEmail.name);

  constructor(
    private featureFlagResolver: FeatureFlagResolver,
    private emailService: EmailService,
  ) {}

  async send({
    broker,
    client,
    invoice,
  }: {
    broker: Broker;
    client: Client;
    invoice: InvoiceEntity;
  }): Promise<null | EmailSendResponse> {
    if (this.featureFlagResolver.isDisabled(FeatureFlag.InvoiceEmails)) {
      this.logger.debug('Invoice emails are disabled. Skipping email send.');
      return null;
    }

    const requireEmail = broker.tags.find(
      (t) => t.key === TagDefinitionKey.BROKER_REQUIRE_EMAIL,
    );
    if (!requireEmail) {
      this.logger.log(
        `Broker with id ${broker.id} doesn't require sending invoice email`,
      );
      return null;
    }
    const invoiceDeliveryEmails = broker.emails.filter(
      (email) => email.type === BrokerEmailType.InvoiceDelivery,
    );

    if (invoiceDeliveryEmails.length === 0) {
      this.logger.warn('Broker does not have active invoice delivery emails.');
      return null;
    }

    const destination: EmailDestination = {
      to: invoiceDeliveryEmails.map((email) => email.email),
      cc: client.factoringConfig.ccInEmails ? client.email : '',
      bcc: '',
    };

    const message: EmailTemplateMessage = {
      subject: `[Bobtail Invoice] Load #: ${invoice.loadNumber}`,
      s3: { key: 'invoicePurchased.hbs' },
      placeholders: {
        loadNumber: invoice.loadNumber,
        client: client,
        approvedAccountsReceivableAmountDollar: penniesToDollars(
          invoice.value,
        ).toFixed(2),
      },
    };
    return await this.emailService.sendTemplate({ destination, message });
  }
}
