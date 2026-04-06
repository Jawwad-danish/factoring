import { BaseModel } from '@core/data';
import { Exclude, Expose, Type } from 'class-transformer';
import { UpcomingAmount } from './upcoming-amount.model';

@Exclude()
export class UpcomingExpediteTransfer extends BaseModel<UpcomingExpediteTransfer> {
  @Expose()
  clientId: string;

  @Expose()
  @Type(() => UpcomingAmount)
  amount: UpcomingAmount;

  @Expose()
  purchasedInvoicesCount: number;

  @Expose()
  underReviewInvoicesCount: number;

  @Expose()
  doneSubmittingInvoices: boolean;

  @Expose()
  isRtpSupported: boolean;
}
