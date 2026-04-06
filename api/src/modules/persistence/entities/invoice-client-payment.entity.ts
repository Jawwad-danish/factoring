import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { ClientPaymentEntity } from './client-payment.entity';
import { InvoiceEntity } from './invoice.entity';

export class InvoiceClientPaymentEntityColumns {
  static id = 'id';
  static amount = 'amount';
}

@Entity({ tableName: 'invoice_client_payments' })
export class InvoiceClientPaymentEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    entity: () => InvoiceEntity,
  })
  invoice: Rel<InvoiceEntity>;

  @Index()
  @ManyToOne({
    entity: () => ClientPaymentEntity,
  })
  clientPayment: Rel<ClientPaymentEntity>;

  @Property({
    fieldName: InvoiceClientPaymentEntityColumns.amount,
    type: BigJsType,
    nullable: false,
    default: 0,
  })
  amount: Big = Big(0);
}
