import { getCurrentLocalDate } from '@core/date-time';
import { TokenResponse } from 'auth0';
import { Auth0Service } from './auth0.service';

export class LocalAuth0Service implements Auth0Service {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async refreshToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      access_token: process.env['M2M_REFRESH_TOKEN'] as string,
      token_type: 'Bearer',
      expires_in: getCurrentLocalDate().add(1, 'hour').unix(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async clientCredentialsGrant(_audience?: string): Promise<TokenResponse> {
    return {
      access_token: process.env['M2M_REFRESH_TOKEN'] as string,
      token_type: 'Bearer',
      expires_in: getCurrentLocalDate().add(1, 'hour').unix(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async changeEmail(_currentEmail: string, _newEmail: string): Promise<void> {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async requestChangePasswordEmail(_email: string): Promise<void> {
    return;
  }
}
