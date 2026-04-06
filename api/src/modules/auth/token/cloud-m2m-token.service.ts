import { Logger } from '@nestjs/common';
import { TokenResponse } from 'auth0';
import dayjs from 'dayjs';
import { CloudAuth0Service } from '../auth0';
import { AuthTokenService } from './auth-token.service';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: dayjs.Dayjs;
}
export class CloudM2MTokenService implements AuthTokenService {
  private readonly logger: Logger = new Logger(CloudM2MTokenService.name);
  private tokenData?: TokenData;

  constructor(private readonly auth0Service: CloudAuth0Service) {}

  async load() {
    await this.loadTokenData();
  }

  private async loadTokenData(): Promise<void> {
    this.logger.log('Retrieving token for M2M');
    let response: TokenResponse;
    if (this.tokenData?.refreshToken) {
      response = await this.auth0Service.refreshToken(
        this.tokenData.refreshToken,
      );
    } else {
      response = await this.auth0Service.clientCredentialsGrant();
    }

    this.tokenData = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      // subtract 10 seconds to make up for a potentially slow response from auth0
      expiresAt: dayjs().add(response.expires_in - 10, 'seconds'),
    };
  }

  async getAccessToken(): Promise<string> {
    if (!this.tokenData || this.tokenData.expiresAt < dayjs()) {
      await this.loadTokenData();
    }

    return this.tokenData?.accessToken as string;
  }
}
