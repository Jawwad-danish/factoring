import { AuditBaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export enum BrokerRole {
  Owner = 'owner',
  Broker = 'broker',
  Accounting = 'accounting',
  Supervisor = 'supervisor',
  Other = 'other',
}

export class BrokerContact extends AuditBaseModel<BrokerContact> {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  countryPhoneCode: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  role: BrokerRole;

  @Expose()
  isPrimary: boolean;
}
