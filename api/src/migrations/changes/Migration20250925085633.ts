import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const tags = [
  {
    name: 'Processing',
    key: 'PROCESSING',
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Info,
    note: 'Processing',
  },
];

export class Migration20250925085633 extends Migration {
  override async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    this.addSql(queryGenerator.addTags(tags));
    this.addSql(
      queryGenerator.addTagToExistingGroup('INVOICE_ISSUES', tags[0].key),
    );
  }

  override async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    const query = queryGenerator.removeTags(tags.map((tag) => tag.key));
    this.addSql(
      queryGenerator.removeTagFromExistingGroup('INVOICE_ISSUES', tags[0].key),
    );
    this.addSql(query);
  }
}
