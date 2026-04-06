import { Injectable, Logger } from '@nestjs/common';
import { SlackCredentialService } from './slack-credentials.service';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly logger: Logger = new Logger(SlackService.name);
  private webhookUrl: string;

  constructor(
    private readonly slackCredentialService: SlackCredentialService,
  ) {}

  async init(): Promise<void> {
    this.webhookUrl = (await this.slackCredentialService.get()).webhookUrl;
  }

  async postErrorMessage(message: string, blocks: any): Promise<void> {
    if (!this.webhookUrl) {
      await this.init();
    }
    try {
      await axios.post(
        this.webhookUrl,
        {
          text: message,
          blocks: blocks,
        },
        {
          headers: { 'Content-type': 'application/json' },
        },
      );
    } catch (error) {
      this.logger.error(
        'Something happened while posting error to slack channel',
        error.stack,
      );
    }
  }
}
