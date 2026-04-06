import { environment } from '@core/environment';
import { SecretsSupplier } from '@module-common';
import { Provider } from '@nestjs/common';
import { CloudAuth0Service } from './cloud-auth0.service';
import { LocalAuth0Service } from './local-auth0.service';

export const AUTH0_SERVICE = 'Auth0Service';

export const Auth0ServiceProvider: Provider = {
  provide: AUTH0_SERVICE,
  useFactory: async (secretsSupplier: SecretsSupplier) => {
    if (environment.isLocal() || environment.isTest()) {
      return new LocalAuth0Service();
    }

    return CloudAuth0Service.init(secretsSupplier);
  },
  inject: [SecretsSupplier],
};
