import { TokenResponse } from 'auth0';

export interface Auth0Service {
  refreshToken(refreshToken: string): Promise<TokenResponse>;

  clientCredentialsGrant(audience?: string): Promise<TokenResponse>;

  changeEmail(currentEmail: string, newEmail: string): Promise<void>;

  requestChangePasswordEmail(email: string): Promise<void>;
}
