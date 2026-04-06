import { Inject, Logger, Injectable } from '@nestjs/common';
import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';

export type FirebaseCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

@Injectable()
export class FirebaseCredentialsService {
  private readonly logger: Logger = new Logger(FirebaseCredentialsService.name);

  constructor(
    @Inject(CONFIG_SERVICE) private readonly configService: ConfigService,
    @Inject(SECRETS_MANAGER) private readonly secretsManager: SecretsManager,
  ) {}

  async getCredentials(): Promise<FirebaseCredentials> {
    const firebaseCredentialsArn = this.configService
      .getValue('FIREBASE_SECRET_ARN')
      .asString();
    try {
      const secrets = await this.secretsManager.fromARN(firebaseCredentialsArn);
      return {
        projectId: secrets.PROJECT_ID as string,
        clientEmail: secrets.CLIENT_EMAIL as string,
        privateKey: secrets.PRIVATE_KEY as string,
      };
    } catch (err) {
      this.logger.error(`Could not read firebase configs, reason: `, err);
      throw err;
    }
  }
}
