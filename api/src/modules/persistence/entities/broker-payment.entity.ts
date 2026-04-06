import { Entity, Enum, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BasicEntitySchema } from './basic.entity';
import { BigJsType } from './big.type';
import { InvoiceEntity } from './invoice.entity';

export class BrokerPaymentEntitySchema extends BasicEntitySchema {
  static TABLE_NAME = 'broker_payments';
  static COLUMN_BATCH_DATE = 'batch_date';
  static COLUMN_AMOUNT = 'amount';
}

export enum BrokerPaymentType {
  Ach = 'ACH',
  Check = 'Check',
}

@Entity({ tableName: BrokerPaymentEntitySchema.TABLE_NAME })
export class BrokerPaymentEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    entity: () => InvoiceEntity,
    eager: true,
  })
  invoice: Rel<InvoiceEntity>;

  @Enum({
    items: () => BrokerPaymentType,
    nullable: true,
  })
  type: null | BrokerPaymentType;

  @Property({
    name: BrokerPaymentEntitySchema.COLUMN_AMOUNT,
    type: BigJsType,
    nullable: false,
    default: 0,
  })
  amount: Big = Big(0);

  @Property({ type: 'varchar', nullable: true })
  checkNumber: null | string;

  @Property({
    type: 'timestamp',
    name: BrokerPaymentEntitySchema.COLUMN_BATCH_DATE,
  })
  batchDate: Date;
}
