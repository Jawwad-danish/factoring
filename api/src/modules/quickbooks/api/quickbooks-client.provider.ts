import { Provider } from '@nestjs/common';
import { QuickBooks } from '@balancer-team/quickbooks';
import { QuickbooksCredentialsService } from '../services/quickbooks-credentials.service';

export const QUICKBOOKS_CLIENT = 'QUICKBOOKS_CLIENT';

export const quickbooksClientProvider: Provider = {
  provide: QUICKBOOKS_CLIENT,
  useFactory: async (credentialsService: QuickbooksCredentialsService) => {
    const creds = await credentialsService.getCreds();
    return new QuickBooks({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      redirectUri: creds.callbackUrl,
      environment: creds.env,
    });
  },
  inject: [QuickbooksCredentialsService],
};
