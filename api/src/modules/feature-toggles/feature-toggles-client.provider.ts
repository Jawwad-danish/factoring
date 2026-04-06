import { Provider } from '@nestjs/common';
import { FeatureTogglesService } from './feature-toggles.service';
import { LaunchDarklyService } from './launch-darkly';

export const FEATURE_TOGGLES_SERVICE = 'FeatureToggleService';

export const FeatureTogglesClientProvider: Provider<FeatureTogglesService> = {
  provide: FEATURE_TOGGLES_SERVICE,
  useFactory: (ldService: FeatureTogglesService) => {
    return ldService;
  },
  inject: [LaunchDarklyService],
};
