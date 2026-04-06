import { Injectable, Logger } from '@nestjs/common';
import { SecretsSupplier } from '../secrets';
import { ReferralRockCredentials } from './referral-rock-credentials.provider';

@Injectable()
export class ReferralRockCredentialsService {
  private readonly logger: Logger = new Logger(
    ReferralRockCredentialsService.name,
  );
  private cached: ReferralRockCredentials | null = null;

  constructor(private readonly secretsSupplier: SecretsSupplier) {}

  async getCreds(): Promise<ReferralRockCredentials> {
    if (this.cached) {
      return this.cached;
    }

    const secrets = await this.secretsSupplier.get('REFERRAL_ROCK_SECRET_ARN');

    const apiUrl = secrets.REFERRAL_ROCK_API_URL as string;
    const basicAuthKey = secrets.REFERRAL_ROCK_BASIC_AUTH_KEY as string;

    if (!apiUrl || !basicAuthKey) {
      this.logger.error(
        'Missing Referral Rock API credentials in AWS Secrets Manager.',
      );
      throw new Error('Missing Referral Rock configuration.');
    }

    const webhookSigningKeysByEventType = new Map<string, string>();
    const prefix = 'REFERRAL_ROCK_WEBHOOK_SIGNING_KEY_';

    for (const [key, value] of Object.entries(secrets)) {
      if (!key.startsWith(prefix)) {
        continue;
      }
      if (typeof value !== 'string') {
        continue;
      }

      const eventType = key.substring(prefix.length).toUpperCase();
      webhookSigningKeysByEventType.set(eventType, value);
    }

    this.cached = {
      apiUrl,
      basicAuthKey,
      webhookSigningKeysByEventType,
    };

    return this.cached;
  }
}
