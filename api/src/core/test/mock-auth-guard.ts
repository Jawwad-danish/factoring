import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppContextHolder, Authentication } from '../app-context';

export class MockAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authHeader = context
      .switchToHttp()
      .getRequest()
      .header('authorization');

    AppContextHolder.get().setAuthentication(Authentication.getSystem());
    return authHeader === process.env.TESTING_AUTHORIZATION_TOKEN;
  }
}
