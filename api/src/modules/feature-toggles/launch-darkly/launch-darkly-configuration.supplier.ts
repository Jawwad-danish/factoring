import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { SECRETS_MANAGER, SecretsManager } from '@module-aws';

const ARN_KEY = 'LAUNCH_DARKLY_SECRET_ARN';

export interface LaunchDarklyConfiguration {
  KEY: string;
}

@Injectable()
export class LaunchDarklyConfigurationSupplier {
  constructor(
    @Inject(CONFIG_SERVICE)
    private readonly configService: ConfigService,
    @Inject(SECRETS_MANAGER)
    private readonly secretsManager: SecretsManager,
  ) {}

  async get(): Promise<LaunchDarklyConfiguration> {
    const arn = this.configService.getValue(ARN_KEY);
    if (!arn.hasValue()) {
      throw new Error('Could not load ARN for LaunchDarkly configuration');
    }

    const secrets = await this.secretsManager.fromARN(arn.asString());

    return {
      KEY: secrets.SDK_KEY as string,
    };
  }
}
