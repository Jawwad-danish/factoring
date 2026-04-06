import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FeatureFlag } from './feature-flags';

@Injectable()
export class FeatureFlagResolver {
  private logger = new Logger(FeatureFlagResolver.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  isEnabled(featureFlag: FeatureFlag): boolean {
    const result = this.configService.getValue(featureFlag);
    if (result.hasValue()) {
      return result.asBoolean();
    } else {
      this.logger.warn('Could not find definition for feature flag', {
        featureFlag,
      });
      return false;
    }
  }

  isDisabled(featureFlag: FeatureFlag): boolean {
    return !this.isEnabled(featureFlag);
  }
}
