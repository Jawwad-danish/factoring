import { AppContextHolder, Authentication } from '@core/app-context';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthenticationManager } from './authentication-manager';

export class AnonymousStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authenticationManager: AuthenticationManager) {
    super();
  }

  async validate(): Promise<Authentication> {
    const authentication = Authentication.getSystem();
    await this.authenticationManager.build(
      authentication.principal.id,
      authentication.principal.email,
      authentication.authority.permissions,
    );
    AppContextHolder.get().setAuthentication(authentication);
    return authentication;
  }
}
