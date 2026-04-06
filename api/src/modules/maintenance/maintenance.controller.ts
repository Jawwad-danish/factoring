import { RequiredPermissions } from '@module-auth';
import { Body, Controller, Get, Injectable, Post } from '@nestjs/common';
import { Permissions } from '../common/permissions';
import { UpdateMaintenanceModeRequest } from './data';
import { MaintenanceStatus } from './data/maintenance.model';
import { MaintenanceMapper } from './data/mappers';
import { AllowDuringMaintenance } from './guards';
import { MaintenanceService } from './services/maintenance.service';

@AllowDuringMaintenance()
@Controller('maintenance')
@Injectable()
export class MaintenanceController {
  constructor(
    private service: MaintenanceService,
    private mapper: MaintenanceMapper,
  ) {}

  @Get()
  async get(): Promise<MaintenanceStatus> {
    const entity = await this.service.get();
    return this.mapper.entityToModel(entity);
  }

  @Post()
  @RequiredPermissions([Permissions.SuperUser])
  async update(
    @Body() payload: UpdateMaintenanceModeRequest,
  ): Promise<MaintenanceStatus> {
    const entity = await this.service.update(payload);
    return this.mapper.entityToModel(entity);
  }
}
