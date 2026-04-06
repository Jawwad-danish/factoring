import {
  Cascade,
  Collection,
  Entity,
  Index,
  LoadStrategy,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { BrokerLimitAssocEntity } from './broker-limit-assoc.entity';

@Entity({ tableName: 'broker_factoring_config' })
export class BrokerFactoringConfigEntity extends BasicMutableEntity {
  @Property({ type: 'uuid' })
  @Index()
  brokerId: string;

  @Property({ type: 'boolean', nullable: true, default: null })
  verificationDelay?: boolean;

  @Property({ type: 'varchar', length: 255, nullable: true, default: null })
  preferences?: string;

  @Property({
    type: BigJsType,
    nullable: true,
    default: null,
    comment: `Threshold for a broker's invoice amount in aging`,
  })
  limitAmount: Big | null = null;

  @Index()
  @OneToMany(
    () => BrokerLimitAssocEntity,
    (reserveRate) => reserveRate.config,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
      strategy: LoadStrategy.SELECT_IN,
    },
  )
  limitHistory = new Collection<BrokerLimitAssocEntity>(this);
}
