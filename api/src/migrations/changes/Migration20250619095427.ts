import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

export class Migration20250619095427 extends Migration {
  override async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    this.addSql(
      queryGenerator.addTagToExistingGroup(
        'PROCESSING_ACTION_ITEMS',
        'VERIFY_INVOICE',
      ),
    );
  }

  override async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    this.addSql(
      queryGenerator.removeTagFromExistingGroup(
        'PROCESSING_ACTION_ITEMS',
        'VERIFY_INVOICE',
      ),
    );
  }
}
