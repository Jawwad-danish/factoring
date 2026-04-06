import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';

export type SegmentCredentials = {
  writeKey: string;
  disable: boolean;
};

@Injectable()
export class SegmentCredentialsService {
  private readonly logger: Logger = new Logger(SegmentCredentialsService.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    @Inject(SECRETS_MANAGER) private readonly secretsManager: SecretsManager,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  async getCredentials(): Promise<SegmentCredentials> {
    const writeKeyArn = this.configService
      .getValue('SEGMENT_SECRET_ARN')
      .asString();
    try {
      const secrets = await this.secretsManager.fromARN(writeKeyArn);
      if ('SEGMENT_WRITE_KEY' in secrets === false) {
        this.logger.error(
          `Could not read SEGMENT_WRITE_KEY from ARN ${writeKeyArn}`,
        );
      }
      return {
        writeKey: secrets.SEGMENT_WRITE_KEY as string,
        disable: !this.featureFlagResolver.isEnabled(FeatureFlag.Segment),
      };
    } catch (err) {
      this.logger.error(`Could not read segmant configs, reason: `, err);
      throw err;
    }
  }
}
