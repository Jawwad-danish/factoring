import {
  Entity,
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  Rel,
} from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { InvoiceEntity } from './invoice.entity';
import { TagDefinitionEntity, UsedByType } from './tag-definition.entity';

@Entity({ tableName: 'invoice_tag_assoc' })
export class InvoiceTagEntity extends BasicEntity {
  @Index()
  @ManyToOne({ entity: () => InvoiceEntity, strategy: LoadStrategy.SELECT_IN })
  invoice: Rel<InvoiceEntity>;

  @Index()
  @ManyToOne({
    entity: () => TagDefinitionEntity,
    strategy: LoadStrategy.SELECT_IN,
    eager: true,
  })
  tagDefinition: TagDefinitionEntity;

  @Enum({
    items: () => UsedByType,
    nullable: false,
  })
  assignedByType: UsedByType;
}
