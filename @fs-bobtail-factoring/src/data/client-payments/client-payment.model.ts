import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TransformFromBig, TransformToBig } from '../../validators';
import { AuditBaseModel, PaymentStatus, PaymentType } from '../common';
import { ClientPaymentType } from './client-payment-type.enum';
import { InvoiceClientPayment } from './invoice-client-payment.model';
import { ReserveClientPayment } from './reserve-client-payment.model';

export class ClientPayment extends AuditBaseModel<ClientPayment> {
  @IsUUID()
  @Expose()
  id!: string;

  @IsUUID()
  @Expose()
  clientId!: string;

  @IsUUID()
  @Expose()
  batchPaymentId!: string;

  @IsEnum(ClientPaymentType)
  @Expose()
  clientPaymentType!: ClientPaymentType;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  amount!: Big;

  @IsEnum(PaymentType)
  @Expose()
  tranferType!: PaymentType;

  @IsEnum(PaymentStatus)
  @Expose()
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  transferFee!: Big;

  @IsUUID()
  @Expose()
  bankAccountId!: string;

  @IsOptional()
  @Expose()
  invoicePayments!: InvoiceClientPayment[];

  @IsOptional()
  @Expose()
  reservePayments!: ReserveClientPayment[];

  @IsOptional()
  @Expose()
  lastFourDigits!: string;
}
