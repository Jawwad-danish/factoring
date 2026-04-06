import { AuditBaseModel, PaymentType } from '../common';
import {
  ClientBatchPaymentStatus,
} from './client-batch-payment-status.enum';
import { ClientPayment } from './client-payment.model';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ClientBatchPayment extends AuditBaseModel<ClientBatchPayment> {
  @IsUUID()
  @Expose()
  id!: string;

  @IsString()
  @Expose()
  name!: string;

  @IsEnum(PaymentType)
  @Expose()
  type!: PaymentType;

  @IsEnum(ClientBatchPaymentStatus)
  @Expose()
  status!: ClientBatchPaymentStatus;

  @IsDateString()
  @Expose()
  expectedPaymentDate!: Date;

  @IsArray()
  @ValidateNested()
  @Type(() => ClientPayment)
  @Expose()
  clientPayments: ClientPayment[] = [];
}
