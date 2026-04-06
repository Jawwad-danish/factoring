import { AppContextHolder } from '@core/app-context';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationManager } from '../authorization';
import { RequiredPermissions } from '../authorization/decorators/required-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private reflector: Reflector,
    private readonly authorizationManager: AuthorizationManager,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get(
      RequiredPermissions,
      context.getHandler(),
    );
    if (!requiredPermissions) {
      return true;
    }
    const user = AppContextHolder.get().getAuthentication();
    return this.authorizationManager.hasRequiredPermissions(
      user,
      requiredPermissions,
    );
  }
}
