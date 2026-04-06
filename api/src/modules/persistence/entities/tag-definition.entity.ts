import {
  Collection,
  Entity,
  Enum,
  Index,
  OneToMany,
  Property,
  types,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { TagGroupAssocEntity } from './tag-group-assoc.entity';
import {
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@fs-bobtail/factoring/data';

export {
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
};

export const INVOICE_REJECTED_REASON_TAGS = [
  TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
  TagDefinitionKey.DUPLICATE_INVOICE,
  TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
  TagDefinitionKey.OTHER_INVOICE_ISSUE,
  TagDefinitionKey.POSSIBLE_CLAIM_ON_LOAD,
  TagDefinitionKey.POD_AND_RATE_CON_NOT_MATCHING,
  TagDefinitionKey.VERIFICATION_UNSUCCESSFUL,
  TagDefinitionKey.REQUESTED_PAPERWORK_NOT_SUBMITTED,
] as const;
export type InvoiceRejectedReasonTagsType =
  (typeof INVOICE_REJECTED_REASON_TAGS)[number];

@Entity({ tableName: 'tag_definitions' })
export class TagDefinitionEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'varchar', nullable: false, unique: false })
  name: string;

  @Index()
  @Property({ type: 'varchar', nullable: false, unique: true })
  key: TagDefinitionKey;

  @Property({ type: 'varchar', nullable: false })
  note: string;

  @Property({ type: types.array, nullable: true })
  notePlaceholders?: string[];

  @Enum({
    items: () => TagDefinitionLevel,
    nullable: false,
  })
  level: TagDefinitionLevel;

  @Enum({
    items: () => UsedByType,
    array: true,
    nullable: false,
  })
  usedBy: UsedByType[];

  @Enum({
    items: () => TagDefinitionVisibility,
    nullable: false,
  })
  visibility: TagDefinitionVisibility;

  @Index()
  @OneToMany(() => TagGroupAssocEntity, (tag) => tag.tag, {
    orphanRemoval: true,
  })
  group: Collection<TagGroupAssocEntity>;
}
