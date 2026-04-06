import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Provider } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Auth0CredentialsService, CognitoConfigService } from '../credentials';
import { AnonymousStrategy } from './anonymous.strategy';
import { Auth0Strategy } from './auth0.strategy';
import { CognitoStrategy } from './cognito.strategy';
import { AuthenticationManager } from './authentication-manager';

export const strategyProvider: Provider = {
  provide: PassportStrategy,
  useFactory: async (
    configService: ConfigService,
    auth0CredentialsService: Auth0CredentialsService,
    cognitoCredentialsService: CognitoConfigService,
    authenticationManager: AuthenticationManager,
  ) => {
    const securityStrategy = configService.getValue('JWT_SECURITY_STRATEGY');
    if (securityStrategy) {
      switch (securityStrategy.asString()) {
        case 'anonymous':
          return new AnonymousStrategy(authenticationManager);

        case 'auth0':
          const auth0Credentials = await auth0CredentialsService.get();
          return new Auth0Strategy(auth0Credentials, authenticationManager);

        case 'cognito':
        default:
          const cognitoCredentials = await cognitoCredentialsService.get();
          return new CognitoStrategy(cognitoCredentials, authenticationManager);
      }
    }
    const auth0Credentials = await auth0CredentialsService.get();
    return new Auth0Strategy(auth0Credentials, authenticationManager);
  },
  inject: [
    CONFIG_SERVICE,
    Auth0CredentialsService,
    CognitoConfigService,
    AuthenticationManager,
  ],
};
