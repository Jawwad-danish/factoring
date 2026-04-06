import { AuditBaseModel } from '@core/data';
import { ClientFactoringStatus, ClientStatusReason } from '@module-persistence';
import { Expose } from 'class-transformer';

export class ClientStatusHistory extends AuditBaseModel<ClientStatusHistory> {
  @Expose()
  id: string;

  @Expose()
  status: ClientFactoringStatus;

  @Expose()
  statusReason: ClientStatusReason;

  @Expose()
  note: string;
}
