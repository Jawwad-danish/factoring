import {
  Cascade,
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import Big from 'big.js';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { FactoringCompanyEntity } from './factoring-company.entity';
import { PendingBuyoutEntity } from './pending-buyout.entity';

@Entity({ tableName: 'pending_buyouts_batch' })
export class PendingBuyoutsBatchEntity extends BasicMutableEntity {
  @ManyToOne({
    entity: () => FactoringCompanyEntity,
    nullable: true,
  })
  factoringCompany: null | FactoringCompanyEntity = null;

  @Property({ type: BigJsType, nullable: false, default: 0 })
  clientPayableFee: Big = Big(0);

  @Property({ type: BigJsType, nullable: false, default: 0 })
  bobtailPayableFee: Big = Big(0);

  @OneToMany(
    () => PendingBuyoutEntity,
    (pendingBuyout) => pendingBuyout.batch,
    {
      cascade: [Cascade.ALL],
      eager: true,
      orphanRemoval: true,
      strategy: LoadStrategy.JOINED,
    },
  )
  buyouts = new Collection<PendingBuyoutEntity>(this);
}
