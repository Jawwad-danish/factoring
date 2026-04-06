import {
  CreateReserveFromReferralRockRequest,
  ReferralRockMemberResponse,
  ReferralRockRewardResponse,
} from '@module-reserves/data';
import axios from 'axios';

export class ReferralRock {
  private readonly refRockAPIurl: string;
  private readonly key: string;

  constructor(refRockAPIurl: string, key: string) {
    this.refRockAPIurl = refRockAPIurl;
    this.key = key;
  }

  async getExistingRewardFromRefRock(
    body: CreateReserveFromReferralRockRequest,
  ): Promise<ReferralRockRewardResponse | null> {
    const getRewardParams = {
      programId: body.ProgramId,
      memberId: body.MemberId,
      query: body.Id,
    };

    try {
      return (
        await axios.get(`${this.refRockAPIurl}/rewards`, {
          params: getRewardParams,
          headers: {
            Authorization: this.key,
          },
        })
      ).data.rewards[0];
    } catch (e) {
      console.error('error getting reward from referral rock', e);
      return null;
    }
  }

  async getMemberDataFromRefRock(
    body: CreateReserveFromReferralRockRequest,
  ): Promise<ReferralRockMemberResponse | null> {
    const getMemberParams = {
      programId: body.ProgramId,
      query: body.MemberId,
    };

    try {
      return (
        await axios.get(`${this.refRockAPIurl}/members`, {
          params: getMemberParams,
          headers: {
            Authorization: this.key,
          },
        })
      ).data.members[0];
    } catch (e) {
      console.error(
        `error getting member ${body.MemberId} from referral rock`,
        e,
      );
      return null;
    }
  }

  externalIdToClientId(externalIdentifier: string): string {
    return externalIdentifier.split(':')[1];
  }
}
