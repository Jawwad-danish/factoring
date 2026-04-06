import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const TAGS_TO_UPDATE = [
  {
    key: 'BROKER_CANCELLED_LOAD',
    oldLevel: 'info',
    newLevel: 'error',
  },
];

export class Migration20251006072036 extends Migration {
  override async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const tag of TAGS_TO_UPDATE) {
      this.addSql(queryGenerator.updateTag(tag.key, { level: tag.newLevel }));
    }
  }

  override async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const tag of TAGS_TO_UPDATE) {
      this.addSql(queryGenerator.updateTag(tag.key, { level: tag.oldLevel }));
    }
  }
}
