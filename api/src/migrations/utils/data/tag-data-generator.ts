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
  createdBy: string;
  updatedBy: string;
};

export type TagDefinitionGroupData = {
  name: string;
  key: string;
};

export type TagDefinitionGroupEntityData = TagDefinitionGroupData & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};

export type TagGroupAssociationEntityData = {
  id: string;
  // snake case is necessary for knex queries when creating entities with relationships
  tag_id: string;
  group_id: string;
  createdAt: Date;
  createdBy: string;
};

/**
 * @deprecated Used only in old migrations
 */
export class TagDataGenerator implements BaseTagDataGenerator {
  buildTag(data: TagDefinitionData): TagDefinitionEntityData {
    return {
      id: UUID.get(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: environment.core.systemId(),
      updatedBy: environment.core.systemId(),
      ...data,
    };
  }

  buildGroup(data: TagDefinitionGroupData): TagDefinitionGroupEntityData {
    return {
      id: UUID.get(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: environment.core.systemId(),
      updatedBy: environment.core.systemId(),
      ...data,
    };
  }

  buildAssociation(groupId: any, tagId: any): TagGroupAssociationEntityData {
    return {
      id: UUID.get(),
      createdAt: new Date(),
      createdBy: environment.core.systemId(),
      tag_id: tagId,
      group_id: groupId,
    };
  }
}
