import { BaseModel } from '@core/data';
import { Expose, Type } from 'class-transformer';
import Big from 'big.js';
import { TransformFromBig } from '@core/decorators';

export class TimeRangeMetrics extends BaseModel<TimeRangeMetrics> {
  @Expose()
  @TransformFromBig({ decimals: 2 })
  @Type(() => String)
  last30Days: Big;

  @Expose()
  @TransformFromBig({ decimals: 2 })
  @Type(() => String)
  last60Days: Big;

  @Expose()
  @TransformFromBig({ decimals: 2 })
  @Type(() => String)
  last90Days: Big;
}
