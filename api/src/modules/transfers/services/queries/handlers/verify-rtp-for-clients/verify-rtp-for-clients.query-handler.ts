import { ClientApi } from '@module-clients';
import { RtpSupportService, VerifyRtpSupportAccount } from '@module-rtp';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { VerifyRtpForClientsQuery } from '../../verify-rtp-for-clients.query';
import { ClientBankAccountStatus } from '@fs-bobtail/factoring/data';
@QueryHandler(VerifyRtpForClientsQuery)
export class VerifyRtpForClientsQueryHandler
  implements IQueryHandler<VerifyRtpForClientsQuery>
{
  private logger = new Logger(VerifyRtpForClientsQueryHandler.name);

  constructor(
    private readonly clientApi: ClientApi,
    private readonly rtpSupportService: RtpSupportService,
  ) {}

  async execute(query: VerifyRtpForClientsQuery): Promise<string[]> {
    this.logger.debug(
      `Verifying RTP support for ${query.clientIds.length} clients`,
    );
    const bankAccountsByClient =
      await this.clientApi.getBankAccountsByclientIds(query.clientIds);

    const activeBankAccountsByClient = bankAccountsByClient
      .map(({ clientId, bankAccounts }) => ({
        clientId,
        bankAccounts: bankAccounts.filter(
          (account) => account.status === ClientBankAccountStatus.Active,
        ),
      }))
      .filter(({ bankAccounts }) => bankAccounts.length > 0);

    const accountsToCheck: VerifyRtpSupportAccount[] = [];
    for (const { clientId, bankAccounts } of activeBankAccountsByClient) {
      for (const account of bankAccounts) {
        accountsToCheck.push({
          clientId,
          accountId: account.id,
          routingNumber: account.getRoutingNumber(),
          wireRoutingNumber: account.getWireRoutingNumber(),
          modernTreasuryExternalAccountId:
            account.modernTreasuryAccount?.externalAccountId,
        });
      }
    }

    if (accountsToCheck.length === 0) {
      return [];
    }

    const supportedAccountIds = await this.rtpSupportService.verifyAccounts(
      accountsToCheck,
    );

    const supportedClientIds = new Set<string>();
    for (const account of accountsToCheck) {
      if (supportedAccountIds.includes(account.accountId)) {
        supportedClientIds.add(account.clientId);
      }
    }

    this.logger.debug(
      `Verified RTP support for ${supportedClientIds.size} clients`,
    );

    return Array.from(supportedClientIds);
  }
}
