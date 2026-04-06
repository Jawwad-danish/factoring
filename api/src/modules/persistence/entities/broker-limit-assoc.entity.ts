import { Entity, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity } from './basic.entity';
import { BigJsType } from './big.type';
import { BrokerFactoringConfigEntity } from './broker-factoring-config.entity';

@Entity({ tableName: 'broker_limit_assoc' })
export class BrokerLimitAssocEntity extends BasicEntity {
  @Property({ type: 'varchar', nullable: false })
  note: string;

  @Property({ type: BigJsType, nullable: true })
  limitAmount: null | Big;

  @Index()
  @ManyToOne({
    entity: () => BrokerFactoringConfigEntity,
  })
  config: Rel<BrokerFactoringConfigEntity>;
}
