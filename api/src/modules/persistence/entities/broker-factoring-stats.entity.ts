import { Entity, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import Big from 'big.js';

@Entity({ tableName: 'broker_factoring_stats' })
export class BrokerFactoringStatsEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'uuid' })
  brokerId: string;

  @Property({ default: -1 })
  averageDaysToPay = -1;

  @Property({ default: -1 })
  totalClientsWorkingWith = -1;

  @Property({ default: -1 })
  totalInvoicesUnderReview = -1;

  @Property({ default: -1 })
  totalInvoicesNotReceived = -1;

  @Property({ default: -1 })
  totalInvoicesShortpaid = -1;

  @Property({ default: -1 })
  totalInvoicesNonPayment = -1;

  @Property({ default: -1 })
  totalAging = -1;

  @Property({
    type: 'timestamp',
    nullable: true,
    length: 3,
  })
  lastPaymentDate: null | Date = null;

  @Property({ type: BigJsType, nullable: false, default: -1 })
  dilutionLast30Days = new Big(-1);

  @Property({ type: BigJsType, nullable: false, default: -1 })
  dilutionLast60Days = new Big(-1);

  @Property({ type: BigJsType, nullable: false, default: -1 })
  dilutionLast90Days = new Big(-1);

  @Property({ type: BigJsType, nullable: false, default: -1 })
  daysToPayLast30Days = new Big(-1);

  @Property({ type: BigJsType, nullable: false, default: -1 })
  daysToPayLast60Days = new Big(-1);

  @Property({ type: BigJsType, nullable: false, default: -1 })
  daysToPayLast90Days = new Big(-1);
}
