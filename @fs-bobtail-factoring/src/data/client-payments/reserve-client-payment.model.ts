import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';
import { AuditBaseModel } from '../../data/common';
import { TransformFromBig, TransformToBig } from '../../validators';
import { Invoice } from '../invoices';
import { Reserve } from '../reserves';

export class ReserveClientPayment extends AuditBaseModel<ReserveClientPayment> {
  @IsUUID()
  @Expose()
  id!: string;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  amount!: Big;

  @IsOptional()
  @Type(() => Reserve)
  @Expose()
  reserve?: Reserve;

  @IsOptional()
  @Type(() => Invoice)
  @Expose()
  invoice?: Invoice;
}
