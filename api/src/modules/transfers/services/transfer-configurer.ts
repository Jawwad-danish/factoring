import { Inject, Injectable, Logger } from '@nestjs/common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { SECRETS_MANAGER, SecretsManager } from '@module-aws';

@Injectable()
export class TransferConfigurer {
  private readonly logger: Logger = new Logger(TransferConfigurer.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    @Inject(SECRETS_MANAGER) private readonly secretsManager: SecretsManager,
  ) {}

  async internalAccountId(): Promise<string> {
    const config = this.configService.getValue('MODERN_TREASURY_SECRET_ARN');
    if (!config.hasValue()) {
      this.logger.error(
        `Could not find MODERN_TREASURY_SECRET_ARN to obtain the internal account id`,
      );
      throw new Error('Could not find account');
    }
    const arn = config.asString();
    try {
      const secrets = await this.secretsManager.fromARN(arn);
      return secrets.INTERNAL_BANK_ACCOUNT_ID as string;
    } catch (error) {
      this.logger.error(`Could not obtain secrets from ARN ${arn}`, error);
      throw error;
    }
  }

  webHookUrl(): string {
    const config = this.configService.getValue('ALB_DOMAIN_ALIAS');
    if (!config.hasValue()) {
      throw new Error('Could not find api url for transfer');
    }
    return config.asString();
  }
}
