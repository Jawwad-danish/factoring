import { AuditBaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export enum BrokerAddressType {
  Office = 'office',
  Mailing = 'mailing',
}
export class BrokerAddress extends AuditBaseModel<BrokerAddress> {
  @Expose()
  id: string;

  @Expose()
  address: string;

  @Expose()
  streetAddress: string;

  @Expose()
  country: string;

  @Expose()
  city: string;

  @Expose()
  state: string;

  @Expose()
  zip: string;

  @Expose()
  type: BrokerAddressType;
}
