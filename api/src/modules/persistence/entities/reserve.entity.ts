import {
  Cascade,
  Collection,
  Entity,
  Enum,
  Index,
  OneToMany,
  OneToOne,
  Property,
  Rel,
} from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity, BasicEntitySchema } from './basic.entity';
import { BigJsType } from './big.type';
import { ReserveBrokerPaymentEntity } from './reserve-broker-payment.entity';
import { ReserveClientPaymentEntity } from './reserve-client-payment.entity';
import { ReserveInvoiceEntity } from './reserve-invoice.entity';
import { ReserveReason } from '@fs-bobtail/factoring/data';
export { ReserveReason };

export class ReserveEntitySchema extends BasicEntitySchema {
  static TABLE_NAME = 'reserves';
  static COLUMN_CLIENT_ID = 'client_id';
  static COLUMN_AMOUNT = 'amount';
  static COLUMN_REASON = 'reason';
}

@Entity({ tableName: ReserveEntitySchema.TABLE_NAME })
export class ReserveEntity extends BasicEntity {
  @Index()
  @Property({
    name: ReserveEntitySchema.COLUMN_CLIENT_ID,
    type: 'uuid',
    nullable: false,
  })
  clientId: string;

  @Property({
    name: ReserveEntitySchema.COLUMN_AMOUNT,
    type: BigJsType,
    nullable: false,
    default: 0,
  })
  amount: Big = Big(0);

  @Enum({
    name: ReserveEntitySchema.COLUMN_REASON,
    items: () => ReserveReason,
    nullable: false,
  })
  reason: ReserveReason;

  @Property({ type: 'json', nullable: true })
  payload: object;

  @Property({ type: 'text', nullable: false })
  note: string;

  @OneToOne(() => ReserveBrokerPaymentEntity, (assoc) => assoc.reserve, {
    cascade: [Cascade.ALL],
    eager: true,
    orphanRemoval: true,
  })
  reserveBrokerPayment?: ReserveBrokerPaymentEntity;

  @OneToMany(() => ReserveClientPaymentEntity, (assoc) => assoc.reserve, {
    cascade: [Cascade.ALL],
    eager: true,
    orphanRemoval: true,
  })
  reserveClientPayments = new Collection<ReserveClientPaymentEntity>(this);

  @OneToOne(() => ReserveInvoiceEntity, (assoc) => assoc.reserve, {
    cascade: [Cascade.ALL],
    eager: true,
    orphanRemoval: true,
  })
  reserveInvoice?: Rel<ReserveInvoiceEntity>;
}
