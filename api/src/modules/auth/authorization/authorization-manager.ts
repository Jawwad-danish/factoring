import { Authentication } from '@core/app-context';
import { Permissions } from '@module-common';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthorizationManager {
  hasRequiredPermissions(
    user: Authentication,
    requiredPermissions: string[],
  ): boolean {
    if (this.isSuperUser(user)) {
      return true;
    }
    return requiredPermissions.every((permission) =>
      user.authority.permissions.includes(permission),
    );
  }

  private isSuperUser(user: Authentication): boolean {
    return user.authority.permissions.includes(Permissions.SuperUser);
  }
}
