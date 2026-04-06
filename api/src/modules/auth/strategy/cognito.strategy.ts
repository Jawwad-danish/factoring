import { AppContextHolder, Authentication } from '@core/app-context';
import { UUID } from '@core/uuid';
import { ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt';
import { CognitoCredentials } from '../credentials';
import { AuthenticationManager } from './authentication-manager';
import { JWTPayload } from './jwt-payload';

export class CognitoStrategy extends PassportStrategy(JWTStrategy, 'jwt') {
  constructor(
    cognitoCredentials: CognitoCredentials,
    private readonly authenticationManager: AuthenticationManager,
  ) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 3,
        jwksUri: `https://cognito-idp.${cognitoCredentials.region}.amazonaws.com/${cognitoCredentials.userPoolId}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: `https://cognito-idp.${cognitoCredentials.region}.amazonaws.com/${cognitoCredentials.userPoolId}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JWTPayload): Promise<Authentication> {
    const id = payload.app_metadata?.id ?? UUID.get();
    if (!payload.email) {
      throw new ForbiddenException('Missing email from JWT Token');
    }
    const authentication = await this.authenticationManager.build(
      id,
      payload.email,
      ['*'],
    );
    AppContextHolder.get().setAuthentication(authentication);
    return authentication;
  }
}
