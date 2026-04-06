import { BaseModel } from '@core/data';
import { TransformFromBig, TransformToBig } from '@core/decorators';
import { Big } from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import { UpcomingAmount } from './upcoming-amount.model';

@Exclude()
export class UpcomingRegularClientAmount extends UpcomingAmount {
  @Expose()
  clientId: string;

  @Expose()
  @TransformFromBig()
  @TransformToBig()
  reservesTotal: Big;
}

@Exclude()
export class UpcomingRegularTransfer extends BaseModel<UpcomingRegularTransfer> {
  @Expose()
  @Type(() => UpcomingRegularClientAmount)
  clientAmounts: UpcomingRegularClientAmount[];

  @Expose()
  purchasedInvoicesCount: number;

  @Expose()
  reservesCount: number;

  @Expose()
  transferTime: Date;

  @Expose()
  @TransformFromBig()
  @TransformToBig()
  totalAmount: Big;
}
