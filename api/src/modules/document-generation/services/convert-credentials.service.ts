import { SecretsSupplier } from '@module-common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

export interface ConvertCredentials {
  key: string;
  uri: string;
}

@Injectable()
export class ConvertCredentialsService {
  private readonly logger: Logger = new Logger(ConvertCredentialsService.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    private readonly secretsSupplier: SecretsSupplier,
  ) {}

  async getCreds(): Promise<ConvertCredentials> {
    const secrets = await this.secretsSupplier.get('CONVERTAPI_SECRET_ARN');
    const key = secrets.CONVERT_API_KEY as string;
    const uri = this.configService.getValue('CONVERT_API_URI').asString();

    if (!key) {
      this.logger.error('Missing Convert API key in AWS Secrets Manager.');
      throw new Error('Missing Convert API configuration.');
    }
    return { key, uri };
  }
}
