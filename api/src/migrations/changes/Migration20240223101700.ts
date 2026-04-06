import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';
import {
  TagDefinitionGroupKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence';

export class Migration20240223101700 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const group of tagsPerGroup) {
      this.addSql(queryGenerator.addTags(group.tags));
      group.tags.map((tag) => {
        this.addSql(
          queryGenerator.addTagToExistingGroup(group.groupKey, tag.key),
        );
      });
    }
  }

  async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const group of tagsPerGroup) {
      group.tags.map((tag) => {
        this.addSql(
          queryGenerator.removeTagFromExistingGroup(group.groupKey, tag.key),
        );
      });
      this.addSql(queryGenerator.removeTags(group.tags.map((tag) => tag.key)));
    }
  }
}

const tagsPerGroup = [
  {
    groupKey: TagDefinitionGroupKey.ISSUES_SENDING_INVOICE_TO_BROKER,
    tags: [
      {
        name: 'Email send failed',
        key: 'EMAIL_SEND_FAILED',
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Warning,
        note: 'Email send failed',
      },
    ],
  },
];
