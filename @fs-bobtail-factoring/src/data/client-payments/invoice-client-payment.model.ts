import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';
import { TransformFromBig } from '../../validators';
import { AuditBaseModel } from '../common';
import { Invoice } from '../invoices';

export class InvoiceClientPayment extends AuditBaseModel<InvoiceClientPayment> {
  @IsUUID()
  @Expose()
  id!: string;

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  amount!: Big;

  @IsOptional()
  @Type(() => Invoice)
  @Expose()
  invoice?: Invoice;
}
