import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { MaintenanceService } from '../services';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@module-auth';

export const ALLOW_DURING_MAINTENANCE_KEY = 'allowDuringMaintenace';
export const AllowDuringMaintenance = () =>
  SetMetadata(ALLOW_DURING_MAINTENANCE_KEY, true);

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    @Inject(Reflector) private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const shouldSkipMaintenanceGuard =
      this.reflector.getAllAndOverride<boolean>(ALLOW_DURING_MAINTENANCE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (isPublic || shouldSkipMaintenanceGuard) {
      return true;
    }

    const maintenance = await this.maintenanceService.get();
    if (maintenance.isEnabled) {
      throw new ForbiddenException(
        `API is under maintenance mode. Reason: ${maintenance.message}`,
      );
    }
    return true;
  }
}
