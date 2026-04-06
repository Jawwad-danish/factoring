import { SecretsSupplier } from '@module-common';
import { Logger } from '@nestjs/common';
import { AuthenticationClient, ManagementClient, TokenResponse } from 'auth0';
import { Auth0Error } from './auth0.error';
import { Auth0Service } from './auth0.service';

export class CloudAuth0Service implements Auth0Service {
  private logger = new Logger();

  private constructor(
    readonly authClient: AuthenticationClient,
    readonly managementClient: ManagementClient,
    readonly audience: string,
  ) {}

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return await this.authClient.refreshToken({
      refresh_token: refreshToken,
    });
  }

  async clientCredentialsGrant(audience?: string): Promise<TokenResponse> {
    return await this.authClient.clientCredentialsGrant({
      audience: audience || this.audience,
    });
  }

  async changeEmail(currentEmail: string, newEmail: string) {
    const users = await this.managementClient.getUsersByEmail(currentEmail);
    if (users.length !== 1) {
      this.logger.error(
        `Could not update email address because no exact user was found`,
        {
          currentEmail,
          newEmail,
        },
      );
      throw new Auth0Error(
        'auth0-unique-email',
        'Could not find user to update email',
      );
    }
    const user = users[0];
    try {
      await this.managementClient.updateUser(
        { id: user._id! },
        { email: newEmail, email_verified: false },
      );
    } catch (error) {
      throw new Auth0Error(
        'auth0-update-email',
        'Could not update email address',
        error,
      );
    }
  }

  async requestChangePasswordEmail(email: string): Promise<void> {
    try {
      await this.authClient.requestChangePasswordEmail({
        email,
        connection: 'Username-Password-Authentication',
      });
    } catch (error) {
      throw new Auth0Error(
        'auth0-reset-password',
        'Could not send password reset email',
        error,
      );
    }
  }

  static async init(
    secretsSupplier: SecretsSupplier,
  ): Promise<CloudAuth0Service> {
    const secrets = await secretsSupplier.get('AUTH0_M2M_SECRET_ARN');
    const audience = secrets.AUTH0_M2M_AUDIENCE as string;
    const authClient = new AuthenticationClient({
      domain: secrets.AUTH0_M2M_DOMAIN as string,
      clientId: secrets.AUTH0_M2M_CLIENT_ID as string,
      clientSecret: secrets.AUTH0_M2M_CLIENT_SECRET as string,
    });
    const managementClient = new ManagementClient({
      domain: secrets.AUTH0_M2M_DOMAIN as string,
      clientId: secrets.AUTH0_M2M_CLIENT_ID as string,
      clientSecret: secrets.AUTH0_M2M_CLIENT_SECRET as string,
      audience: audience,
    });

    return new CloudAuth0Service(authClient, managementClient, audience);
  }
}
