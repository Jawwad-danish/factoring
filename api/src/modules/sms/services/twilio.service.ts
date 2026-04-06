import { SecretsSupplier } from '@module-common';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

@Injectable()
export class TwilioService implements OnModuleInit {
  private client: Twilio;
  private fromPhoneNumber: string;
  private logger = new Logger(TwilioService.name);
  constructor(private readonly secretsSupplier: SecretsSupplier) {}

  async onModuleInit() {
    try {
      const secrets = await this.secretsSupplier.get('TWILIO_SECRET_ARN');

      const accountSid = secrets.TWILIO_ACCOUNT_SID as string;
      const authToken = secrets.TWILIO_AUTH_TOKEN as string;
      this.fromPhoneNumber = secrets.TWILIO_PHONE_NUMBER as string;

      if (!accountSid || !authToken || !this.fromPhoneNumber) {
        this.logger.error('Missing Twilio secrets in AWS Secrets Manager.');
        throw new Error('Missing Twilio configuration.');
      }

      this.client = new Twilio(accountSid, authToken);
    } catch (error) {
      this.logger.error('Error initializing TwilioService:', error);
      throw error;
    }
  }

  async sendMessage(
    message: string,
    to: string,
    from: string | null = null,
  ): Promise<MessageInstance> {
    return this.client.messages.create({
      body: message,
      from: from ?? this.fromPhoneNumber,
      to,
    });
  }
}
