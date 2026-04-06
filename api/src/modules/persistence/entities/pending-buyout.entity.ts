import {
  Entity,
  Index,
  LoadStrategy,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import Big from 'big.js';
import { Type } from 'class-transformer';
import { TransformFromBig, TransformToBig } from '../../../core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { PendingBuyoutsBatchEntity } from './pending-buyouts-batch.entity';

@Entity({ tableName: 'pending_buyouts' })
export class PendingBuyoutEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'varchar', nullable: false })
  loadNumber: string;

  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Index()
  @ManyToOne({
    entity: () => PendingBuyoutsBatchEntity,
    eager: true,
    nullable: false,
    strategy: LoadStrategy.JOINED,
  })
  batch: PendingBuyoutsBatchEntity;

  @Property({ type: 'varchar', nullable: true })
  brokerMC: string | null;

  @Property({ type: 'varchar', nullable: true })
  brokerName: string | null;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  rate: Big = Big(0);

  @Property({ type: 'timestamp', nullable: false })
  paymentDate: Date;
}
