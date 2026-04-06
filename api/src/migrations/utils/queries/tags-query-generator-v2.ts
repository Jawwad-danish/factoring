import { AbstractSqlDriver } from '@mikro-orm/postgresql';
import { BaseTagsQueryGenerator } from './base-tags-query-generator';
import { TagDataGeneratorV2 } from '../data/tag-data-generator-v2';

/**
 * Helper class used to manipulate tags in migrations.
 * This class only generates queries. These queries must
 * added to the migration for them to be executed
 */
export class TagsQueryGeneratorV2 extends BaseTagsQueryGenerator {
  // Creates Tag Group, Tags and Tag Group associations

  constructor(protected readonly driver: AbstractSqlDriver) {
    super(driver, new TagDataGeneratorV2());
  }
}
