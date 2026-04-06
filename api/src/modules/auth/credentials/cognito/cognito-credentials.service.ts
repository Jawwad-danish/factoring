import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

export interface CognitoCredentials {
  region: string;
  userPoolId: string;
}

@Injectable()
export class CognitoConfigService {
  private readonly logger: Logger = new Logger(CognitoConfigService.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    @Inject(SECRETS_MANAGER) private readonly secretsManager: SecretsManager,
  ) {}

  async get(): Promise<CognitoCredentials> {
    const config = this.configService.getValue('COGNITO_SECRET_ARN');
    const arn = config.asString();
    try {
      const secrets = await this.secretsManager.fromARN(arn);
      return {
        region: secrets.AWS_COGNITO_REGION as string,
        userPoolId: secrets.AWS_COGNITO_USER_POOL_ID as string,
      };
    } catch (error) {
      this.logger.error(`Could not obtain secrets from ARN ${arn}`, error);
      throw error;
    }
  }
}
