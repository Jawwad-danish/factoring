import { Provider } from '@nestjs/common';
import { SlackCredentialService } from './slack-credentials.service';
import { SlackService } from './slack.service';
import { environment } from '@core/environment';
import { EmptySlackService } from './slack.empty-service';

export const SLACK_SERVICE = 'SlackService';

export const slackServiceProvider: Provider = {
  provide: SLACK_SERVICE,
  useFactory: async (slackCredentialService: SlackCredentialService) => {
    if (environment.isDevelopment() || environment.isStaging()) {
      const service = new SlackService(slackCredentialService);
      await service.init();
      return service;
    } else {
      const service = new EmptySlackService();
      return service;
    }
  },
  inject: [SlackCredentialService],
};
