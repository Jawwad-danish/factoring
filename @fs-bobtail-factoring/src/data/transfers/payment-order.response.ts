
import { Expose } from 'class-transformer';
import { AuditBaseModel } from '../common/audit-base.model';

export class PaymentOrder extends AuditBaseModel<PaymentOrder> {

  @Expose()
  id!: string;

  @Expose()
  batchTransferId!: string;

  @Expose()
  amount!: number;
}
