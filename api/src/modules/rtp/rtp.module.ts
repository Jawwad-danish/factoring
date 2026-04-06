import { AuthModule } from '@module-auth';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import {
  FeatureTogglesModule,
  LaunchDarklyModule,
} from '@module-feature-toggles';
import { Module } from '@nestjs/common';
import { TransfersApiModule } from '../transfers/transfers-api.module';
import { VerifyRtpSupportQueryHandler } from './queries';
import { RtpSupportService } from './services';

@Module({
  imports: [
    AuthModule,
    BobtailConfigModule,
    CqrsModule,
    FeatureTogglesModule,
    LaunchDarklyModule,
    TransfersApiModule,
  ],
  providers: [RtpSupportService, VerifyRtpSupportQueryHandler],
  exports: [RtpSupportService],
})
export class RtpModule {}
