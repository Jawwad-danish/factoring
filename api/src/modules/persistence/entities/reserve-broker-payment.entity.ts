import {
  Cascade,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  Rel,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BrokerPaymentEntity } from './broker-payment.entity';
import { ReserveEntity } from './reserve.entity';

@Entity({ tableName: 'reserves_broker_payment' })
export class ReserveBrokerPaymentEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    cascade: [Cascade.ALL],
    entity: () => BrokerPaymentEntity,
    eager: true,
  })
  brokerPayment: BrokerPaymentEntity;

  @OneToOne({
    cascade: [Cascade.ALL],
    entity: () => ReserveEntity,
    lazy: true,
  })
  reserve: Rel<ReserveEntity>;
}
