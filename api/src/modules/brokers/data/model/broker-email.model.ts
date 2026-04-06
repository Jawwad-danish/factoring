import { AuditBaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export enum BrokerEmailType {
  NOA = 'NOA',
  PaymentStatus = 'payment_status',
  InvoiceDelivery = 'invoice_delivery',
}
export class BrokerEmail extends AuditBaseModel<BrokerEmail> {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  type: BrokerEmailType;
}
