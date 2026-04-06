import { Query } from '@mikro-orm/migrations';
import { AbstractSqlDriver } from '@mikro-orm/postgresql';
import {
  TagDefinitionEntity,
  TagDefinitionGroupEntity,
  TagGroupAssocEntity,
} from '@module-persistence/entities';
import { TagGroupBuilder } from '../builders';
import { BaseQueryGenerator } from './base-query-generator';
import { BaseTagDataGenerator } from '../data/base-tag-data-generator';

/**
 * Helper class used to manipulate tags in migrations.
 * This class only generates queries. These queries must
 * added to the migration for them to be executed
 */
export class BaseTagsQueryGenerator extends BaseQueryGenerator {
  constructor(
    protected readonly driver: AbstractSqlDriver,
    protected readonly dataBuilder: BaseTagDataGenerator,
  ) {
    super(driver);
  }
  addTag(data: Record<string, any>): Query {
    const entityData = this.dataBuilder.buildTag(data);
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionEntity.name)
        .insert(entityData)
        .onConflict('key')
        .ignore(),
    );
  }

  addTags(data: Record<string, any>[]): Query {
    const entitiesData = data.map((rawTag) =>
      this.dataBuilder.buildTag(rawTag),
    );
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionEntity.name)
        .insert(entitiesData)
        .onConflict('key')
        .ignore(),
    );
  }

  removeTag(key: string): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionEntity.name)
        .delete({ key: key }),
    );
  }

  removeTags(keys: string[]): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionEntity.name)
        .delete({ key: { $in: keys } }),
    );
  }

  updateTag(oldTagKey: string, updateData: any): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionEntity.name)
        .update(updateData)
        .where({ key: oldTagKey }),
    );
  }

  // Creates Tag Group, Tags and Tag Group associations
  createTagGroup(tagGroupBuilder: TagGroupBuilder): Query[] {
    const data = tagGroupBuilder.build();

    const tagGroupQuery = this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionGroupEntity.name)
        .insert(data.group),
    );
    const tagsQuery = this.addTags(data.tags);

    const tagGroupAssociationsQueries = data.associations.map((assoc) => {
      return this.createTagGroupAssociation(assoc);
    });

    return [tagGroupQuery, tagsQuery, ...tagGroupAssociationsQueries];
  }

  removeTagGroups(keys: string[]): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagDefinitionGroupEntity)
        .delete({ key: { $in: keys } }),
    );
  }

  addTagToExistingGroup(groupKey: string, tagKey: string): Query {
    const tagGroupQuery = this.driver
      .createQueryBuilder(TagDefinitionGroupEntity.name)
      .select('id')
      .where({ key: groupKey })
      .limit(1)
      .getKnexQuery();
    const tagDefinitionQuery = this.driver
      .createQueryBuilder(TagDefinitionEntity.name)
      .select('id')
      .where({ key: tagKey })
      .limit(1)
      .getKnexQuery();
    const entityData = this.dataBuilder.buildAssociation(
      tagGroupQuery,
      tagDefinitionQuery,
    );

    return this.getQuery(
      this.driver
        .createQueryBuilder(TagGroupAssocEntity.name)
        .insert(entityData),
    );
  }

  removeTagFromExistingGroup(groupKey: string, tagKey: string): Query {
    const tagGroupQuery = this.driver
      .createQueryBuilder(TagDefinitionGroupEntity.name)
      .select('id')
      .where({ key: groupKey })
      .limit(1)
      .getKnexQuery();
    const tagDefinitionQuery = this.driver
      .createQueryBuilder(TagDefinitionEntity.name)
      .select('id')
      .where({ key: tagKey })
      .limit(1)
      .getKnexQuery();
    return this.getQuery(
      this.driver.createQueryBuilder(TagGroupAssocEntity.name).delete({
        tag_id: tagDefinitionQuery,
        group_id: tagGroupQuery,
      }),
    );
  }

  createTagGroupAssociation(data: Record<string, any>): Query {
    return this.getQuery(
      this.driver.createQueryBuilder(TagGroupAssocEntity.name).insert(data),
    );
  }

  removeTagGroupAssociationByGroupKeys(groupKeys: string[]): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(TagGroupAssocEntity.name)
        .delete()
        .where({ group: { key: { $in: groupKeys } } }),
    );
  }
}
