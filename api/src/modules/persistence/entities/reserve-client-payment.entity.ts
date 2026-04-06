import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { ClientPaymentEntity } from './client-payment.entity';
import { ReserveEntity } from './reserve.entity';
import { BigJsType } from './big.type';
import Big from 'big.js';

@Entity({ tableName: 'reserves_client_payment' })
export class ReserveClientPaymentEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    entity: () => ClientPaymentEntity,
  })
  clientPayment?: Rel<ClientPaymentEntity>;

  @ManyToOne({
    entity: () => ReserveEntity,
  })
  reserve?: Rel<ReserveEntity>;

  @Property({ type: BigJsType, nullable: false, default: 0 })
  amount: Big = Big(0);
}
