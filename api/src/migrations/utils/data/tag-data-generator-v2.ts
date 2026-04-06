import { environment } from '@core/environment';
import { UUID } from '@core/uuid';
import { BaseTagDataGenerator } from './base-tag-data-generator';

export type TagDefinitionData = {
  name: string;
  key: string;
  usedBy: string[];
  visibility: string;
  level: string;
  note: string;
  notePlaceholders?: string[];
};

export type TagDefinitionEntityData = TagDefinitionData & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  created_by_id: string;
  updated_by_id: string;
};

export type TagDefinitionGroupData = {
  name: string;
  key: string;
};

export type TagDefinitionGroupEntityData = TagDefinitionGroupData & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  created_by_id: string;
  updated_by_id: string;
};

export type TagGroupAssociationEntityData = {
  id: string;
  // snake case is necessary for knex queries when creating entities with relationships
  tag_id: string;
  group_id: string;
  createdAt: Date;
  created_by_id: string;
};

export class TagDataGeneratorV2 implements BaseTagDataGenerator {
  buildTag(data: TagDefinitionData): TagDefinitionEntityData {
    return {
      ...data,
      id: UUID.get(),
      createdAt: new Date(),
      updatedAt: new Date(),
      created_by_id: environment.core.systemId(),
      updated_by_id: environment.core.systemId(),
    };
  }

  buildGroup(data: TagDefinitionGroupData): TagDefinitionGroupEntityData {
    return {
      ...data,
      id: UUID.get(),
      createdAt: new Date(),
      updatedAt: new Date(),
      created_by_id: environment.core.systemId(),
      updated_by_id: environment.core.systemId(),
    };
  }

  buildAssociation(groupId: any, tagId: any): TagGroupAssociationEntityData {
    return {
      id: UUID.get(),
      createdAt: new Date(),
      created_by_id: environment.core.systemId(),
      tag_id: tagId,
      group_id: groupId,
    };
  }
}
