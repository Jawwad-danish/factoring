import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SecretsSupplier {
  private logger = new Logger(SecretsSupplier.name);

  constructor(
    @Inject(SECRETS_MANAGER) private readonly secretsManager: SecretsManager,
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
  ) {}

  async get(secretArnKeyName: string): Promise<Record<string, unknown>> {
    const config = this.configService.getValue(secretArnKeyName);
    const arn = config.asString();
    try {
      return await this.secretsManager.fromARN(arn);
    } catch (error) {
      this.logger.error(`Could not obtain secrets from ARN ${arn}`, error);
      throw error;
    }
  }
}
