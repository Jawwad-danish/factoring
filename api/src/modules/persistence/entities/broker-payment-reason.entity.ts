import { Entity, Enum, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum BrokerPaymentReasonType {
  Shortpaid = 'shortpaid',
  Nonpayment = 'nonpayment',
  Overpaid = 'overpaid',
}

@Entity({ tableName: 'broker_payment_reasons' })
export class BrokerPaymentReasonEntity extends BasicMutableEntity {
  @Property({ type: 'varchar', nullable: false })
  reason: string;

  @Enum({
    items: () => BrokerPaymentReasonType,
    nullable: false,
  })
  type: BrokerPaymentReasonType;
}
