import { TransformFromBig } from '@core/decorators';
import { AuditBaseModel } from '@core/data';
import { Big } from 'big.js';
import { Expose, Type } from 'class-transformer';

export class BrokerLimitHistory extends AuditBaseModel<BrokerLimitHistory> {
  @Expose()
  id: string;

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  amount: null | Big;

  @Expose()
  note: string;
}
