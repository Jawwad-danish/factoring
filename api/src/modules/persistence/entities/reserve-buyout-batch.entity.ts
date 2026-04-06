import { Cascade, Entity, Index, ManyToOne } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { PendingBuyoutsBatchEntity } from './pending-buyouts-batch.entity';
import { ReserveEntity } from './reserve.entity';

@Entity({ tableName: 'reserves_buyout_batch' })
export class ReserveBuyoutBatchEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    entity: () => PendingBuyoutsBatchEntity,
    lazy: true,
    cascade: [Cascade.ALL],
  })
  batch: PendingBuyoutsBatchEntity;

  @ManyToOne({
    cascade: [Cascade.ALL],
    entity: () => ReserveEntity,
    lazy: true,
  })
  reserve: ReserveEntity;
}
