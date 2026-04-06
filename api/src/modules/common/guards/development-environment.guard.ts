import { environment } from '@core/environment';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DevelopmentEnvironmentGuard implements CanActivate {
  canActivate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return (
      environment.isLocal() ||
      environment.isDevelopment() ||
      environment.isStaging()
    );
  }
}
