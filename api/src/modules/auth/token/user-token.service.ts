import { AppContextHolder } from '@core/app-context';
import { Injectable } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class UserTokenService implements AuthTokenService {
  async getAccessToken(): Promise<string> {
    const context = AppContextHolder.get();
    return context.accessToken;
  }
}
