import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { TagDefinitionEntity } from './tag-definition.entity';

export enum InvoiceTagDefinitionCategory {
  System = 'system',
  User = 'user',
}

export enum InvoiceTagDefinitionVisibility {
  Client = 'client',
  Employee = 'employee',
  All = 'all',
}

@Entity({ tableName: 'invoice_tag_definitions' })
export class InvoiceTagDefinitionEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    entity: () => TagDefinitionEntity,
  })
  tagDefinition: TagDefinitionEntity;

  @Enum({
    items: () => InvoiceTagDefinitionCategory,
    nullable: false,
  })
  category: InvoiceTagDefinitionCategory;

  @Property({ type: 'varchar', nullable: false })
  payloadFormat: string;

  @Enum({
    items: () => InvoiceTagDefinitionVisibility,
    nullable: false,
  })
  visibility: InvoiceTagDefinitionVisibility;
}
