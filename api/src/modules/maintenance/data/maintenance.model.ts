import { AuditBaseModel } from '@core/data';

export class MaintenanceStatus extends AuditBaseModel<MaintenanceStatus> {
  isEnabled: boolean;
  message: string;
}
