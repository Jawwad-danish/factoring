import { LDClient, LDContext } from '@launchdarkly/node-server-sdk';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FeatureTogglesService } from '../feature-toggles.service';
import { LD_CLIENT } from './launch-darkly-client.provider';

@Injectable()
export class LaunchDarklyService implements FeatureTogglesService {
  private logger = new Logger(LaunchDarklyService.name);

  constructor(
    @Inject(LD_CLIENT)
    private ldClient: LDClient,
  ) {}

  async isEnabledForClient(
    clientId: string,
    flag: string,
    defaultValue: boolean,
  ) {
    const context: LDContext = {
      kind: 'client',
      key: clientId,
    };
    this.ldClient.identify(context);
    try {
      return await this.ldClient.boolVariation(flag, context, defaultValue);
    } catch (error) {
      this.logger.error(
        `LaunchDarkly evaluation failed for flag ${flag}. Using default value`,
        {
          flag,
          context,
        },
      );
      return defaultValue;
    }
  }
}
