import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'client_factoring_analytics' })
export class ClientFactoringAnalyticsEntity extends BasicMutableEntity {
  @Index()
  @Unique()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({
    type: 'timestamp',
    length: 3,
    nullable: true,
  })
  firstPurchasedDate: Date | null = null;

  @Property({
    type: 'timestamp',
    length: 3,
    nullable: true,
  })
  firstCreatedDate: Date | null = null;
}
