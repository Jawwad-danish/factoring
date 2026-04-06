import { Module } from '@nestjs/common';
import { LaunchDarklyModule } from './launch-darkly';
import {
  FEATURE_TOGGLES_SERVICE,
  FeatureTogglesClientProvider,
} from './feature-toggles-client.provider';

@Module({
  imports: [LaunchDarklyModule],
  providers: [FeatureTogglesClientProvider],
  exports: [FEATURE_TOGGLES_SERVICE],
})
export class FeatureTogglesModule {}
