import { TransformFromBig } from '@core/decorators';
import Big from 'big.js';
import { Expose } from 'class-transformer';

export class CompleteInvoiceKpiResponse {
  @Expose()
  @TransformFromBig()
  accountsReceivable0to30: Big;

  @Expose()
  @TransformFromBig()
  accountsReceivable30to60: Big;

  @Expose()
  @TransformFromBig()
  accountsReceivableOver60: Big;

  @Expose()
  @TransformFromBig()
  accountsReceivableTotal: Big;

  constructor(
    accountsReceivable0to30: Big,
    accountsReceivable30to60: Big,
    accountsReceivableOver60: Big,
    accountsReceivableTotal: Big,
  ) {
    this.accountsReceivable0to30 = accountsReceivable0to30;
    this.accountsReceivable30to60 = accountsReceivable30to60;
    this.accountsReceivableOver60 = accountsReceivableOver60;
    this.accountsReceivableTotal = accountsReceivableTotal;
  }
}
