import { TransformFromBig } from '@core/decorators';
import { AuditBaseModel } from '@core/data';
import { Big } from 'big.js';
import { Expose, Type } from 'class-transformer';

export class ClientLimitHistory extends AuditBaseModel<ClientLimitHistory> {
  @Expose()
  id: string;

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  amount: null | Big;

  @Expose()
  note: string;
}
