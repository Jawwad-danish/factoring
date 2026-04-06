import { AuditBaseModel } from '../common';
import { TransformFromBig, TransformToBig } from '../../validators';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class InvoiceBuyout extends AuditBaseModel<InvoiceBuyout> {
  @IsUUID()
  @Expose()
  id!: string;

  @IsNotEmpty()
  @IsDateString()
  @Expose()
  paymentDate!: Date;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  rate: Big = Big(0);
}
