import { TransformFromBig } from '@core/decorators';
import Big from 'big.js';
import { Expose } from 'class-transformer';

export class InvoiceKpiResponse {
  @Expose()
  @TransformFromBig()
  purchased: Big = new Big(0);

  @Expose()
  @TransformFromBig()
  underReview: Big = new Big(0);

  @Expose()
  @TransformFromBig()
  invoicesWithIssues: Big = new Big(0);

  constructor(purchased: Big, underReview: Big, invoicesWithIssues: Big) {
    this.purchased = purchased;
    this.underReview = underReview;
    this.invoicesWithIssues = invoicesWithIssues;
  }
}
