import { environment } from '@core/environment';
import { Provider } from '@nestjs/common';
import { AUTH0_SERVICE, CloudAuth0Service } from '../auth0';
import { CloudM2MTokenService } from './cloud-m2m-token.service';
import { LocalM2MTokenService } from './local-m2m-token.service';

export const AUTH0_M2M_TOKEN_SERVICE = 'Auth0M2MTokenService';

export const AuthTokenServiceProvider: Provider = {
  provide: AUTH0_M2M_TOKEN_SERVICE,
  useFactory: async (auth0Service: CloudAuth0Service) => {
    if (environment.isLocal() || environment.isTest()) {
      return new LocalM2MTokenService();
    }
    const cloudTokenProvider = new CloudM2MTokenService(auth0Service);
    await cloudTokenProvider.load();
    return cloudTokenProvider;
  },
  inject: [AUTH0_SERVICE],
};
