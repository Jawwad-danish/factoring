import { SecretsSupplier } from '@module-common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

type QuickbooksEnvironment = 'sandbox' | 'production';

export interface QuickbooksConfig {
  clientId: string;
  clientSecret: string;
  env: QuickbooksEnvironment;
  callbackUrl: string;
}

@Injectable()
export class QuickbooksCredentialsService {
  private readonly logger: Logger = new Logger(
    QuickbooksCredentialsService.name,
  );

  constructor(
    private readonly secretsSupplier: SecretsSupplier,
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  async getCreds(): Promise<QuickbooksConfig> {
    const secrets = await this.secretsSupplier.get('QUICKBOOKS_SECRET_ARN');

    const clientId = secrets.QUICKBOOKS_API_CLIENT_ID as string;
    const clientSecret = secrets.QUICKBOOKS_API_SECRET_KEY as string;
    const env = secrets.QUICKBOOKS_ENV as QuickbooksEnvironment;

    const config = this.configService.getValue('ALB_DOMAIN_ALIAS');
    if (!config.hasValue()) {
      throw new Error('Could not find api url for quickbooks callback');
    }
    const callbackUrl = new URL('/quickbooks/callback', config.asString());

    if (!clientId || !clientSecret || !env) {
      this.logger.error('Missing Quickbooks API configuration.');
      throw new Error('Missing Quickbooks API configuration.');
    }
    return {
      clientId,
      clientSecret,
      env,
      callbackUrl: callbackUrl.toString(),
    };
  }
}
