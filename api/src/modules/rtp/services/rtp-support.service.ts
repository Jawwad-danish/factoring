import { Inject, Injectable } from '@nestjs/common';
import {
  FEATURE_TOGGLES_SERVICE,
  FeatureTogglesService,
  LDFlags,
} from '@module-feature-toggles';
import { VerifyRtpSupportAccount } from '../queries/verify-rtp-support.query';
import { TransfersApi } from '../../transfers/api';

type ClientIntegrationBuckets = {
  bofa: VerifyRtpSupportAccount[];
  modernTreasury: VerifyRtpSupportAccount[];
};

@Injectable()
export class RtpSupportService {
  constructor(
    private readonly transfersApi: TransfersApi,
    @Inject(FEATURE_TOGGLES_SERVICE)
    private readonly featureTogglesService: FeatureTogglesService,
  ) {}

  async verifyAccounts(accounts: VerifyRtpSupportAccount[]): Promise<string[]> {
    if (!accounts || accounts.length === 0) {
      return [];
    }

    const buckets = await this.partitionAccountsByIntegration(accounts);

    const [bofaVerified, modernTreasuryVerified] = await Promise.all([
      this.findBofaVerifiedAccounts(buckets.bofa),
      this.findModernTreasuryVerifiedAccounts(buckets.modernTreasury),
    ]);

    return [...bofaVerified, ...modernTreasuryVerified];
  }

  private async partitionAccountsByIntegration(
    accounts: VerifyRtpSupportAccount[],
  ): Promise<ClientIntegrationBuckets> {
    const buckets: ClientIntegrationBuckets = {
      bofa: [],
      modernTreasury: [],
    };

    const accountsByClient = new Map<string, VerifyRtpSupportAccount[]>();
    for (const account of accounts) {
      if (!accountsByClient.has(account.clientId)) {
        accountsByClient.set(account.clientId, []);
      }
      accountsByClient.get(account.clientId)?.push(account);
    }

    for (const [clientId, clientAccounts] of accountsByClient) {
      const shouldUseBofa = await this.featureTogglesService.isEnabledForClient(
        clientId,
        LDFlags.useBankOfAmericaIntegration,
        false,
      );

      if (shouldUseBofa) {
        buckets.bofa.push(...clientAccounts);
      } else {
        buckets.modernTreasury.push(...clientAccounts);
      }
    }

    return buckets;
  }

  private async findBofaVerifiedAccounts(
    accounts: VerifyRtpSupportAccount[],
  ): Promise<string[]> {
    if (accounts.length === 0) {
      return [];
    }

    const routingNumbers = new Set<string>();
    for (const account of accounts) {
      if (account.routingNumber) {
        routingNumbers.add(account.routingNumber);
      }
      if (account.wireRoutingNumber) {
        routingNumbers.add(account.wireRoutingNumber);
      }
    }

    if (routingNumbers.size === 0) {
      return [];
    }

    const verifiedRoutingNumbers = new Set(
      (await this.transfersApi.verifyRTPSupportForRoutingNumbers(
        Array.from(routingNumbers),
      )) || [],
    );

    return accounts
      .filter((a) => {
        const hasVerifiedRoutingNumber =
          a.routingNumber && verifiedRoutingNumbers.has(a.routingNumber);
        const hasVerifiedWireRoutingNumber =
          a.wireRoutingNumber &&
          verifiedRoutingNumbers.has(a.wireRoutingNumber);

        return hasVerifiedRoutingNumber || hasVerifiedWireRoutingNumber;
      })
      .map((a) => a.accountId);
  }

  private async findModernTreasuryVerifiedAccounts(
    accounts: VerifyRtpSupportAccount[],
  ): Promise<string[]> {
    if (accounts.length === 0) {
      return [];
    }

    const externalAccountIds = accounts
      .map((a) => a.modernTreasuryExternalAccountId)
      .filter((id): id is string => !!id);

    if (externalAccountIds.length === 0) {
      return [];
    }

    const verifiedExternalAccountIds = new Set(
      (await this.transfersApi.verifyRTPSupportForAccounts(
        externalAccountIds,
      )) || [],
    );

    return accounts
      .filter((a) =>
        a.modernTreasuryExternalAccountId
          ? verifiedExternalAccountIds.has(a.modernTreasuryExternalAccountId)
          : false,
      )
      .map((a) => a.accountId);
  }
}
