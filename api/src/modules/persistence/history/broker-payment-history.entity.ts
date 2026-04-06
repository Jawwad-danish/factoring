import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import Big from 'big.js';
import { BrokerPaymentType } from '../entities';
import { BigJsType } from '../entities/big.type';
import { HistoryEntity } from './history.entity';

@Entity({ tableName: 'broker_payments_history' })
export class BrokerPaymentHistoryEntity extends HistoryEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  invoiceId: string;

  @Enum({
    items: () => BrokerPaymentType,
    nullable: true,
  })
  type: null | BrokerPaymentType;

  @Property({ type: BigJsType, nullable: false })
  amount: Big = Big(0);

  @Property({ type: 'varchar', nullable: true })
  checkNumber: null | string;

  @Property({ type: 'timestamp' })
  batchDate: Date;
}
