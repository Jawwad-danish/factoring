import { BaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export class ClientSalesRep extends BaseModel<ClientSalesRep> {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}
