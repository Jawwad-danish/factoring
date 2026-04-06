import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { SmsMessage } from '../data';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly twilioService: TwilioService) {}

  async sendSms(to: string, message: string): Promise<SmsMessage> {
    try {
      const response = await this.twilioService.sendMessage(message, to);
      this.logger.log(`SMS sent successfully to ${to}, SID: ${response.sid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error);
      throw new Error('SMS sending failed');
    }
  }
}
