import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { BrokerPaymentReasonEntity } from './broker-payment-reason.entity';
import { BrokerPaymentEntity } from './broker-payment.entity';

@Entity({ tableName: 'broker_payment_reasons_assoc' })
export class BrokerPaymentReasonAssocEntity extends BasicEntity {
  @Property({ type: 'varchar', nullable: false })
  note: string;

  @ManyToOne({
    entity: () => BrokerPaymentEntity,
  })
  brokerPayment: BrokerPaymentEntity;

  @ManyToOne({
    entity: () => BrokerPaymentReasonEntity,
  })
  brokerPaymentReason: BrokerPaymentReasonEntity;
}
