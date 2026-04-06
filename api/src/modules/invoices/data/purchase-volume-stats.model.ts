import { TransformFromBig, TransformToBig } from '@core/decorators';
import { Big } from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import { BaseModel } from '@core/data';

@Exclude()
export class InvoiceVolumeStats extends BaseModel<InvoiceVolumeStats> {
  @Expose()
  @TransformFromBig()
  @TransformToBig()
  amount: Big;

  @Expose()
  count: number;
}

@Exclude()
export class PurchaseVolume extends BaseModel<PurchaseVolume> {
  @Expose()
  @Type(() => InvoiceVolumeStats)
  purchasedUnpaid: InvoiceVolumeStats;

  @Expose()
  @Type(() => InvoiceVolumeStats)
  purchasedPaid: InvoiceVolumeStats;
}
