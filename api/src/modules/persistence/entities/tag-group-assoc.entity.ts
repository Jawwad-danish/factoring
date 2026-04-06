import { Entity, ManyToOne, Rel } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { TagDefinitionGroupEntity } from './tag-definition-group.entity';
import { TagDefinitionEntity } from './tag-definition.entity';

@Entity({ tableName: 'tag_group_assoc' })
export class TagGroupAssocEntity extends BasicEntity {
  @ManyToOne({
    entity: () => TagDefinitionGroupEntity,
  })
  group: TagDefinitionGroupEntity;

  @ManyToOne({
    entity: () => TagDefinitionEntity,
  })
  tag: Rel<TagDefinitionEntity>;
}
