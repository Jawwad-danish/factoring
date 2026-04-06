import { AWSModule } from '@module-aws';
import { BobtailConfigModule } from '@module-config';
import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption';
import { ExpediteConfigurer } from './expedite';
import { FeatureFlagResolver } from './feature-flag';
import {
  DevelopmentEnvironmentGuard,
  ReferralRockWebhookGuard,
} from './guards';
import {
  REFERRAL_ROCK_CREDENTIALS,
  ReferralRockService,
  referralRockCredentialsProvider,
} from './referral-rock';
import { ReferralRockCredentialsService } from './referral-rock/referral-rock-credentials.service';
import { SecretsSupplier } from './secrets';
import { TransferTimeService } from './transfer-time/transfer-time.service';
import { UserMapper } from './user';

const referralRockServiceProvider = {
  provide: ReferralRockService,
  useFactory: async (
    referralRockCredentialsService: ReferralRockCredentialsService,
  ) => {
    const creds = await referralRockCredentialsService.getCreds();
    return new ReferralRockService(creds.apiUrl, creds.basicAuthKey);
  },
  inject: [ReferralRockCredentialsService],
};

@Module({
  exports: [
    FeatureFlagResolver,
    UserMapper,
    TransferTimeService,
    ExpediteConfigurer,
    ReferralRockService,
    REFERRAL_ROCK_CREDENTIALS,
    SecretsSupplier,
    DevelopmentEnvironmentGuard,
    ReferralRockWebhookGuard,
    EncryptionService,
  ],
  imports: [BobtailConfigModule, AWSModule],
  providers: [
    FeatureFlagResolver,
    UserMapper,
    TransferTimeService,
    ExpediteConfigurer,
    ReferralRockCredentialsService,
    referralRockCredentialsProvider,
    referralRockServiceProvider,
    SecretsSupplier,
    DevelopmentEnvironmentGuard,
    ReferralRockWebhookGuard,
    EncryptionService,
  ],
})
export class CommonModule {}
