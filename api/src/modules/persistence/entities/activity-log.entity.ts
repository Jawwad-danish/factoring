import {
  Entity,
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  Property,
  Rel,
} from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { InvoiceEntity } from './invoice.entity';
import { TagDefinitionEntity } from './tag-definition.entity';

export enum TagStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}
@Entity({ tableName: 'invoice_activity_log' })
export class ActivityLogEntity extends BasicEntity {
  @Index()
  @ManyToOne({
    entity: () => TagDefinitionEntity,
    eager: true,
    nullable: false,
    strategy: LoadStrategy.JOINED,
  })
  tagDefinition: TagDefinitionEntity;

  @Enum({
    items: () => TagStatus,
    nullable: false,
    default: TagStatus.Active,
  })
  tagStatus: TagStatus = TagStatus.Active;

  @Property({ type: 'uuid', nullable: false, defaultRaw: 'uuid_generate_v4()' })
  groupId: string;

  @Property({ type: 'text', nullable: false, unique: false })
  note: string;

  @Property({ type: 'json', nullable: false, unique: false })
  payload: object;

  @Index()
  @ManyToOne({
    entity: () => InvoiceEntity,
  })
  invoice: Rel<InvoiceEntity>;
}
