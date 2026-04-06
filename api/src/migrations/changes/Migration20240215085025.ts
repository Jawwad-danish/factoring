import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';
import { TagDefinitionGroupKey, TagDefinitionKey } from '@module-persistence';

export class Migration20240215085025 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const groupKey of tagGroupKeys)
      this.addSql(
        queryGenerator.addTagToExistingGroup(groupKey, TagDefinitionKey.OTHER),
      );
  }

  async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const groupKey of tagGroupKeys)
      this.addSql(
        queryGenerator.removeTagFromExistingGroup(
          groupKey,
          TagDefinitionKey.OTHER,
        ),
      );
  }
}

const tagGroupKeys = [
  TagDefinitionGroupKey.NON_PAYMENT_REASONS,
  TagDefinitionGroupKey.BROKER_PAYMENT_ISSUES,
];
