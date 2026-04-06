import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const tags = [
  {
    key: 'BROKER_SENT_PAYMENT_VIA_E_CHECK',
    oldLevel: 'error',
    newLevel: 'warning',
  },
];

export class Migration20251218092642 extends Migration {
  override async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const tag of tags) {
      const query = tagsQueryGenerator.updateTag(tag.key, {
        level: tag.newLevel,
      });
      this.addSql(query);
    }
  }

  override async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const tag of tags) {
      const query = tagsQueryGenerator.updateTag(tag.key, {
        level: tag.oldLevel,
      });
      this.addSql(query);
    }
  }
}
