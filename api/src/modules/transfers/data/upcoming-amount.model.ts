import { BaseModel } from '@core/data';
import { TransformFromBig, TransformToBig } from '@core/decorators';
import Big from 'big.js';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpcomingAmount extends BaseModel<UpcomingAmount> {
  @Expose()
  @TransformFromBig()
  @TransformToBig()
  fee: Big;

  @Expose()
  @TransformFromBig()
  @TransformToBig()
  invoicesTotal: Big;

  @Expose()
  @TransformFromBig()
  @TransformToBig()
  transferable: Big;
}
