export interface AuthTokenService {
  getAccessToken(): Promise<string>;
}
