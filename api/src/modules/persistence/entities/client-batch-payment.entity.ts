import {
  Collection,
  Entity,
  Enum,
  Index,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { ClientPaymentEntity } from './client-payment.entity';
import { BasicMutableEntity } from './basic-mutable.entity';
import { PaymentType } from './payment.common';

export enum ClientBatchPaymentStatus {
  Done = 'done',
  Pending = 'pending',
  InProgress = 'in_progress',
  Failed = 'failed',
  NotSent = 'not_sent',
}

@Entity({ tableName: 'client_batch_payments' })
export class ClientBatchPaymentEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'varchar', nullable: false, unique: true })
  name: string;

  @Enum({
    items: () => PaymentType,
    nullable: false,
  })
  type: PaymentType;

  @Enum({
    items: () => ClientBatchPaymentStatus,
    nullable: false,
  })
  status: ClientBatchPaymentStatus;

  @Property({
    type: 'timestamp',
    length: 3,
  })
  expectedPaymentDate: Date;

  @Index()
  @OneToMany(() => ClientPaymentEntity, (payment) => payment.batchPayment, {
    orphanRemoval: true,
    eager: false,
  })
  clientPayments = new Collection<ClientPaymentEntity>(this);
}
