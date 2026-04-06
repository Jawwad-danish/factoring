import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

export class MockPermissionsGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authHeader = context
      .switchToHttp()
      .getRequest()
      .header('authorization');

    return authHeader === process.env.TESTING_AUTHORIZATION_TOKEN;
  }
}
