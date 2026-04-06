import { AuditBaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export class ClientPaymentPlanHistory extends AuditBaseModel<ClientPaymentPlanHistory> {
  @Expose()
  id: string;

  @Expose()
  paymentPlan: null | string;

  @Expose()
  note: null | string;
}
