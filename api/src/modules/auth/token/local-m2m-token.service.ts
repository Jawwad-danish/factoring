import { Injectable } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

@Injectable()
export class LocalM2MTokenService implements AuthTokenService {
  async getAccessToken(): Promise<string> {
    return process.env['M2M_ACCESS_TOKEN'] as string;
  }
}
