import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGenerator } from '../utils';

export class Migration20240118155627 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    for (const [tagGroupKey, tagsToAdd] of Object.entries(tagsPerGroup)) {
      for (const tagKey of tagsToAdd) {
        this.addSql(
          tagsQueryGenerator.addTagToExistingGroup(tagGroupKey, tagKey),
        );
      }
    }
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    for (const [tagGroupKey, tagsToRemove] of Object.entries(tagsPerGroup)) {
      for (const tagKey of tagsToRemove) {
        this.addSql(
          tagsQueryGenerator.removeTagFromExistingGroup(tagGroupKey, tagKey),
        );
      }
    }
  }
}

const tagsPerGroup = {
  NON_PAYMENT_REASONS: ['MISSING_DOCUMENT'],
};
