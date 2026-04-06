import { environment } from '@core/environment';
import { Provider } from '@nestjs/common';
import { CloudSecretsManager } from './cloud-secrets-manager';
import { LocalSecretsManager } from './local-secrets-manager';
import { SECRETS_MANAGER } from './secrets-manager';

export const secretsManagerProvider: Provider = {
  provide: SECRETS_MANAGER,
  useFactory: async () => {
    if (environment.isLocal() || environment.isTest()) {
      return new LocalSecretsManager();
    }
    return new CloudSecretsManager();
  },
  inject: [],
};
