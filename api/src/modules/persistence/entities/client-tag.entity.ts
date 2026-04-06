import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { TagDefinitionEntity } from './tag-definition.entity';

@Entity({ tableName: 'client_tag_assoc' })
export class ClientTagEntity extends BasicEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Index()
  @ManyToOne({ entity: () => TagDefinitionEntity })
  tagDefinition: TagDefinitionEntity;
}
