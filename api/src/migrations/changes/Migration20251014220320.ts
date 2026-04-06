import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence';

const tags = [
  {
    name: 'Invoice Purchased',
    key: 'PURCHASE_INVOICE',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Invoice Purchased',
  },

  {
    name: 'Invoice Rejected',
    key: 'REJECT_INVOICE',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Invoice Rejected',
  },

  {
    name: 'Invoice Reverted to Under Review',
    key: 'REVERT_INVOICE',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Invoice Reverted to Under Review',
  },
];

export class Migration20251014220320 extends Migration {
  override async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const tag of tags) {
      this.addSql(queryGenerator.addTag(tag));
    }
  }

  override async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const tag of tags) {
      this.addSql(queryGenerator.removeTag(tag.key));
    }
  }
}
