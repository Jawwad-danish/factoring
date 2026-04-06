import { Client } from '@module-clients/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { ClientStatusReason } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  EmailSendResponse,
  EmailService,
  EmailTemplateMessage,
} from '../services';

const friendlyMessages = {
  [ClientStatusReason.Inactivity]: 'inactivity',
  [ClientStatusReason.FMCSAIssues]: 'FMCSA issues',
  [ClientStatusReason.BuyoutInProgress]: 'buyout in progress',
  [ClientStatusReason.Other]: 'other',
  [ClientStatusReason.SwitchedFactoringCompany]: 'switched factoring company',
  [ClientStatusReason.InsuranceIssues]: 'insurance issues',
  [ClientStatusReason.NoLongerFactoring]: 'no longer factoring',
  [ClientStatusReason.ReadyToFactor]: 'ready to factor',
  [ClientStatusReason.SubmittingInvoices]: 'submitting invoices',
  [ClientStatusReason.InvoiceIssues]: 'invoice issues',
  [ClientStatusReason.AdditionalInformationRequired]:
    'additional information required',
  [ClientStatusReason.ClientLimitExceeded]: 'client limit exceeded',
  [ClientStatusReason.PreviousWriteOff]: 'previous write off',
};

@Injectable()
export class ClientToOnHoldEmail {
  private logger = new Logger(ClientToOnHoldEmail.name);

  constructor(
    private featureFlagResolver: FeatureFlagResolver,
    private emailService: EmailService,
  ) {}

  async send({
    client,
    reason,
  }: {
    client: Client;
    reason: ClientStatusReason;
  }): Promise<null | EmailSendResponse> {
    if (this.featureFlagResolver.isDisabled(FeatureFlag.InvoiceEmails)) {
      this.logger.debug('Invoice emails are disabled. Skipping email send.');
      return null;
    }

    const message: EmailTemplateMessage = {
      subject: `You Bobtail account has been put On Hold`,
      s3: { key: 'client-to-on-hold-status.hbs' },
      placeholders: {
        clientName: client.name,
        reason: friendlyMessages[reason] ?? reason,
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
