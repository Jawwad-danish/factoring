import { ValidationError } from '@core/validation';
import { Client, ClientService } from '@module-clients';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { Injectable, Logger } from '@nestjs/common';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';
import { ClientBankAccount } from '@fs-bobtail/factoring/data';
import { RtpSupportService } from '@module-rtp';

@Injectable()
export class ClientBankAccountValidator implements PurchaseInvoiceValidator {
  private logger: Logger = new Logger(ClientBankAccountValidator.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly rtpSupportService: RtpSupportService,
  ) {}

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { entity, client } = context;

    const activeBankAccount = await this.clientService.getPrimaryBankAccount(
      client.id,
    );

    if (!activeBankAccount) {
      this.logger.error(
        'Could not purchase invoice because the client does not have an active bank account',
        {
          invoiceId: entity.id,
          status: entity.status,
        },
      );
      throw new ValidationError(
        'no-active-client-bank-account',
        'Could not purchase invoice because the client does not have an active bank account',
      );
    }
    if (entity.expedited) {
      const isRtpSupported = await this.isRtpSupportedByBankAccount(
        activeBankAccount,
        client,
      );
      const isWireSupported =
        this.isWireSupportedByBankAccount(activeBankAccount);

      if (!isRtpSupported && !isWireSupported) {
        this.logger.error(
          'Could not purchase invoice because the client active bank account does not support wire/rtp',
          {
            invoiceId: entity.id,
            status: entity.status,
          },
        );
        throw new ValidationError(
          'no-active-client-bank-account',
          'Could not purchase invoice because the client active bank account does not support wire/rtp',
        );
      }
    }
  }

  private async isRtpSupportedByBankAccount(
    bankAccount: ClientBankAccount,
    client: Client,
  ): Promise<boolean> {
    const accountToBeVerified = {
      clientId: client.id,
      accountId: bankAccount.id,
      routingNumber: bankAccount.getRoutingNumber(),
      modernTreasuryExternalAccountId:
        bankAccount.modernTreasuryAccount?.externalAccountId,
    };
    const verifiedRoutingNumbers = await this.rtpSupportService.verifyAccounts([
      accountToBeVerified,
    ]);
    return verifiedRoutingNumbers.length > 0;
  }

  private isWireSupportedByBankAccount(
    bankAccount: ClientBankAccount,
  ): boolean {
    return !!(
      bankAccount.modernTreasuryAccount?.confirmedWire ||
      bankAccount.wireRoutingNumber ||
      bankAccount.plaidAccount?.wireRoutingNumber
    );
  }
}
