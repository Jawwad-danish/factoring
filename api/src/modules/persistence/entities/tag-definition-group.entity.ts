import {
  Collection,
  Entity,
  Index,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { TagGroupAssocEntity } from './tag-group-assoc.entity';

export enum TagDefinitionGroupKey {
  INVOICE_ISSUES = 'INVOICE_ISSUES',
  PROCESSING_ACTION_ITEMS = 'PROCESSING_ACTION_ITEMS',
  ISSUES_SENDING_INVOICE_TO_BROKER = 'ISSUES_SENDING_INVOICE_TO_BROKER',
  CLIENT_PAYMENT_ISSUES = 'CLIENT_PAYMENT_ISSUES',
  BROKER_PAYMENT_ISSUES = 'BROKER_PAYMENT_ISSUES',
  BROKER_PAYMENT_ACTION_ITEMS = 'BROKER_PAYMENT_ACTION_ITEMS',
  BROKER_CONFIGURATION = 'BROKER_CONFIGURATION',
  REJECTION_REASONS = 'REJECTION_REASONS',
  NON_PAYMENT_REASONS = 'NON_PAYMENT_REASONS',
  TECHNICAL_ISSUES = 'TECHNICAL_ISSUES',
  INTERNAL_INVOICE_ISSUES = 'INTERNAL_INVOICE_ISSUES',
  OTHER = 'OTHER',
}

@Entity({ tableName: 'tag_definition_group' })
export class TagDefinitionGroupEntity extends BasicMutableEntity {
  @Property({ type: 'varchar', nullable: false })
  name: string;

  @Index()
  @Property({ type: 'varchar', nullable: false, unique: true })
  key: string;

  @Index()
  @OneToMany(() => TagGroupAssocEntity, (tag) => tag.group, {
    orphanRemoval: true,
    eager: true,
  })
  tags = new Collection<TagGroupAssocEntity>(this);
}
