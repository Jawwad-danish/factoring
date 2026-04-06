import { Provider } from '@nestjs/common';
import { ReferralRockCredentialsService } from './referral-rock-credentials.service';

export interface ReferralRockCredentials {
  apiUrl: string;
  basicAuthKey: string;
  webhookSigningKeysByEventType: Map<string, string>;
}

export const REFERRAL_ROCK_CREDENTIALS = 'REFERRAL_ROCK_CREDENTIALS';

export const referralRockCredentialsProvider: Provider<ReferralRockCredentials> =
  {
    provide: REFERRAL_ROCK_CREDENTIALS,
    useFactory: async (
      credentialsService: ReferralRockCredentialsService,
    ): Promise<ReferralRockCredentials> => {
      return credentialsService.getCreds();
    },
    inject: [ReferralRockCredentialsService],
  };
