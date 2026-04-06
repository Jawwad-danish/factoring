import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

export interface SlackCredentials {
  webhookUrl: string;
}

@Injectable()
export class SlackCredentialService {
  private readonly logger: Logger = new Logger(SlackCredentialService.name);

  constructor(
    @Inject(SECRETS_MANAGER) private readonly secretsManager: SecretsManager,
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  async get(): Promise<SlackCredentials> {
    const config = this.configService.getValue('SLACK_SECRET_ARN');
    const arn = config.asString();
    try {
      const secrets = await this.secretsManager.fromARN(arn);
      return {
        webhookUrl: secrets.WEBHOOK_URL as string,
      };
    } catch (error) {
      this.logger.error(`Could not obtain secrets from ARN ${arn}`, error);
      throw error;
    }
  }
}
