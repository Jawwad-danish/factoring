import { Query } from '@module-cqrs';

export interface VerifyRtpSupportAccount {
  clientId: string;
  accountId: string;
  routingNumber?: string;
  wireRoutingNumber?: string;
  modernTreasuryExternalAccountId?: string;
}

export class VerifyRtpSupportQuery extends Query<string[]> {
  constructor(readonly accounts: VerifyRtpSupportAccount[]) {
    super();
  }
}
