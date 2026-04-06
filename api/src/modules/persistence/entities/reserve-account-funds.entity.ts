import { Entity, Index, Property } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity } from './basic.entity';
import { BigJsType } from './big.type';

@Entity({ tableName: 'reserve_account_funds' })
export class ReserveAccountFundsEntity extends BasicEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({ type: BigJsType, nullable: false, default: 0 })
  amount: Big = Big(0);

  @Property({ type: 'text', nullable: false })
  note: string;
}
