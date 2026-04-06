import { ReferralRock } from '@core/services';
import {
  CreateReserveFromReferralRockRequest,
  ReferralRockMemberResponse,
  ReferralRockRewardResponse,
} from '@module-reserves/data';

export class ReferralRockService {
  private readonly client: ReferralRock;

  constructor(url: string, key: string) {
    this.client = new ReferralRock(url, key);
  }

  async getExistingRewardFromRefRock(
    body: CreateReserveFromReferralRockRequest,
  ): Promise<ReferralRockRewardResponse | null> {
    return this.client.getExistingRewardFromRefRock(body);
  }

  async getMemberDataFromRefRock(
    body: CreateReserveFromReferralRockRequest,
  ): Promise<ReferralRockMemberResponse | null> {
    return this.client.getMemberDataFromRefRock(body);
  }

  externalIdToClientId(externalIdentifier: string): string {
    return this.client.externalIdToClientId(externalIdentifier);
  }
}
