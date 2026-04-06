import {
  Cascade,
  Collection,
  Entity,
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import Big from 'big.js';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { ClientBatchPaymentEntity } from './client-batch-payment.entity';
import { InvoiceClientPaymentEntity } from './invoice-client-payment.entity';
import { PaymentStatus, PaymentType } from './payment.common';
import { ReserveClientPaymentEntity } from './reserve-client-payment.entity';

export enum ClientPaymentType {
  Invoice = 'invoice',
  Reserve = 'reserve',
  Other = 'other',
}

export enum ClientPaymentOperationType {
  Credit = 'credit',
  Debit = 'debit',
}
@Entity({ tableName: 'client_payments' })
export class ClientPaymentEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Index()
  @ManyToOne({
    entity: () => ClientBatchPaymentEntity,
  })
  batchPayment: ClientBatchPaymentEntity;

  @Enum({
    items: () => ClientPaymentType,
    nullable: false,
  })
  type: ClientPaymentType;

  @OneToMany(() => InvoiceClientPaymentEntity, (p) => p.clientPayment, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  invoicePayments = new Collection<InvoiceClientPaymentEntity>(this);

  @OneToMany(() => ReserveClientPaymentEntity, (p) => p.clientPayment, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  reservePayments = new Collection<ReserveClientPaymentEntity>(this);

  @Property({ type: BigJsType, nullable: false, default: 0 })
  amount: Big = Big(0);

  @Enum({
    items: () => ClientPaymentOperationType,
    nullable: false,
  })
  operationType: ClientPaymentOperationType;

  @Enum({
    items: () => PaymentType,
    nullable: false,
  })
  transferType: PaymentType;

  @Enum({
    items: () => PaymentStatus,
    nullable: false,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus = PaymentStatus.PENDING;

  @Property({ type: BigJsType, nullable: false, default: 0 })
  transferFee: Big = Big(0);

  @Index()
  @Property({ type: 'uuid', nullable: true })
  clientBankAccountId: string;

  @Property({ type: 'text', nullable: true, length: 4 })
  bankAccountLastDigits: string;
}
