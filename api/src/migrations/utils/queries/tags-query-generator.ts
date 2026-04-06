import { AbstractSqlDriver } from '@mikro-orm/postgresql';
import { BaseTagsQueryGenerator } from './base-tags-query-generator';
import { TagDataGenerator } from '../data/tag-data-generator';

/**
 * @deprecated only used in old migrations
 * Helper class used to manipulate tags in migrations.
 * This class only generates queries. These queries must
 * added to the migration for them to be executed
 */
export class TagsQueryGenerator extends BaseTagsQueryGenerator {
  // Creates Tag Group, Tags and Tag Group associations

  constructor(protected readonly driver: AbstractSqlDriver) {
    super(driver, new TagDataGenerator());
  }
}
