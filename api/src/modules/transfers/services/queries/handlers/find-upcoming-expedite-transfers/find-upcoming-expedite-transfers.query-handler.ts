import { transferableAmount } from '@core/formulas';
import { ExpediteConfigurer } from '@module-common';
import { BasicQueryHandler } from '@module-cqrs';
import { ClientFactoringConfigsRepository } from '@module-persistence';
import { InvoiceEntity, InvoiceStatus } from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { UpcomingAmount, UpcomingExpediteTransfer } from '../../../../data';
import { FindUpcomingExpediteTransfersQuery } from '../../find-upcoming-expedite-transfers.query';
import { TransferDataAccess } from '../../../commands';
import { ClientService } from '@module-clients';
import { ClientBankAccountStatus } from '@fs-bobtail/factoring/data';
import { RtpSupportService, VerifyRtpSupportAccount } from '@module-rtp';

@QueryHandler(FindUpcomingExpediteTransfersQuery)
export class FindUpcomingExpediteTransfersQueryHandler
  implements BasicQueryHandler<FindUpcomingExpediteTransfersQuery>
{
  private logger = new Logger(FindUpcomingExpediteTransfersQueryHandler.name);

  constructor(
    private readonly expediteConfigurer: ExpediteConfigurer,
    private readonly transfersDataAccess: TransferDataAccess,
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly clientService: ClientService,
    private readonly rtpSupportService: RtpSupportService,
  ) {}

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _query: FindUpcomingExpediteTransfersQuery,
  ): Promise<UpcomingExpediteTransfer[]> {
    const clients = await this.getClients();
    const clientsInvoices = await this.getInvoicesForClients(
      Array.from(clients.keys()),
    );
    for (const [client, upcoming] of clients) {
      const invoices = clientsInvoices.get(client);
      if (!invoices) {
        this.logger.warn('Could not find invoices for client', {
          clientId: client,
        });
        continue;
      }
      this.setInvoicesCount(invoices, upcoming);
      this.setTransferAmount(invoices, upcoming);
    }
    await this.setDoneSubmittingInvoices(clients);
    return Array.from(clients.values());
  }

  private async getClients(): Promise<Map<string, UpcomingExpediteTransfer>> {
    const clientIds = await this.transfersDataAccess.expediteClients();

    if (clientIds.length === 0) {
      return new Map<string, UpcomingExpediteTransfer>();
    }

    const clients = await this.clientService.findByIds(clientIds, {
      includeBankAccounts: true,
    });

    // Build a batched list of active bank accounts to verify RTP support for
    const accountsToVerify: VerifyRtpSupportAccount[] = [];
    for (const client of clients) {
      const primaryBankAccount = client.bankAccounts?.find(
        (bankAccount) => bankAccount.status == ClientBankAccountStatus.Active,
      );

      if (!primaryBankAccount) {
        this.logger.log(
          `client ${client.id} has no active bank accounts, skipping expedite transfer`,
        );
        continue;
      }

      accountsToVerify.push({
        clientId: client.id,
        accountId: primaryBankAccount.id,
        routingNumber: primaryBankAccount.getRoutingNumber(),
        wireRoutingNumber: primaryBankAccount.getWireRoutingNumber(),
        modernTreasuryExternalAccountId:
          primaryBankAccount.modernTreasuryAccount?.externalAccountId,
      });
    }

    // Single batched call to determine which accounts support RTP
    let rtpSupportedAccountIds = new Set<string>();
    if (accountsToVerify.length > 0) {
      const verifiedAccountIds = await this.rtpSupportService.verifyAccounts(
        accountsToVerify,
      );
      rtpSupportedAccountIds = new Set(verifiedAccountIds);
    }

    const map = new Map<string, UpcomingExpediteTransfer>();

    // Keep only clients that have at least one active bank account that either
    // has a wire routing number or is RTP-supported
    for (const client of clients) {
      const bankAccounts = client.bankAccounts || [];
      const activeAccount = bankAccounts.find(
        (account) => account.status === ClientBankAccountStatus.Active,
      );

      if (!activeAccount) {
        continue;
      }

      const isWireSupported =
        activeAccount.modernTreasuryAccount?.confirmedWire ||
        activeAccount.wireRoutingNumber ||
        activeAccount.plaidAccount?.wireRoutingNumber;
      const isRtpSupported = rtpSupportedAccountIds.has(activeAccount.id);
      const hasEligibleAccount = isWireSupported || isRtpSupported;

      if (hasEligibleAccount) {
        map.set(
          client.id,
          new UpcomingExpediteTransfer({
            clientId: client.id,
            amount: new UpcomingAmount({
              fee: new Big(0),
              invoicesTotal: new Big(0),
              transferable: new Big(0),
            }),
            underReviewInvoicesCount: 0,
            purchasedInvoicesCount: 0,
            doneSubmittingInvoices: false,
            isRtpSupported: isRtpSupported,
          }),
        );
      }
    }

    return map;
  }

  private async getInvoicesForClients(
    clientIds: string[],
  ): Promise<Map<string, InvoiceEntity[]>> {
    const invoices =
      await this.transfersDataAccess.getInvoicesForExpediteTransfer(clientIds);
    const map = new Map<string, InvoiceEntity[]>();
    for (const invoice of invoices) {
      if (!map.has(invoice.clientId)) {
        map.set(invoice.clientId, []);
      }
      map.get(invoice.clientId)?.push(invoice);
    }
    return map;
  }

  private setInvoicesCount(
    invoices: InvoiceEntity[],
    upcoming: UpcomingExpediteTransfer,
  ) {
    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.UnderReview) {
        upcoming.underReviewInvoicesCount += 1;
      }
      if (invoice.status === InvoiceStatus.Purchased) {
        upcoming.purchasedInvoicesCount += 1;
      }
    }
  }

  private async setTransferAmount(
    invoices: InvoiceEntity[],
    upcoming: UpcomingExpediteTransfer,
  ) {
    const toPayInvoices = invoices.filter(
      (invoice) => invoice.status === InvoiceStatus.Purchased,
    );
    const fee = this.expediteConfigurer.expediteFee();
    const amount = transferableAmount(toPayInvoices, fee);
    upcoming.amount = new UpcomingAmount({
      fee: this.expediteConfigurer.expediteFee(),
      transferable: amount,
      invoicesTotal: amount.plus(fee),
    });
  }

  private async setDoneSubmittingInvoices(
    clients: Map<string, UpcomingExpediteTransfer>,
  ) {
    const clientConfigs =
      await this.clientFactoringConfigRepository.findByClientIds(
        Array.from(clients.keys()),
      );

    for (const clientKey of Array.from(clients.keys())) {
      const clientConfig = clientConfigs.find(
        (client) => client.clientId === clientKey,
      );
      if (!clientConfig) {
        this.logger.warn('Did not find client config for client key', {
          clientId: clientKey,
        });
        continue;
      }
      const client = clients.get(clientKey) as UpcomingExpediteTransfer;
      client.doneSubmittingInvoices = clientConfig.doneSubmittingInvoices;
    }
  }
}
