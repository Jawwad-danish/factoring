import { AuditBaseModel } from '@core/data';
import { TransformFromBig } from '@core/decorators';
import { ClientPayment } from '@fs-bobtail/factoring/data';
import {
  ClientBatchPaymentStatus,
  PaymentType,
} from '@module-persistence/entities';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';

export class CompleteTransfer extends AuditBaseModel<CompleteTransfer> {
  @Expose()
  id: string;

  @Expose()
  type: PaymentType;

  @Expose()
  status: ClientBatchPaymentStatus;

  @Expose()
  sentDate: Date;

  @Expose()
  arrivalDate: Date;

  @Expose()
  @TransformFromBig()
  amount: Big;

  @Type(() => ClientPayment)
  @Expose()
  clientPayments: ClientPayment[];
}
