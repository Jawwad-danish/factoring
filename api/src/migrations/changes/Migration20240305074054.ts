import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

export class Migration20240305074054 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    const updateQuery = tagsQueryGenerator.updateTag('OVER_90_DAYS', {
      record_status: 'Inactive',
    });
    this.addSql(updateQuery);
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    const updateQuery = tagsQueryGenerator.updateTag('OVER_90_DAYS', {
      record_status: 'Active',
    });
    this.addSql(updateQuery);
  }
}
