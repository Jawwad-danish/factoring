import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const tags = [
  {
    name: 'Broker limit exceeded',
    key: 'BROKER_LIMIT_EXCEEDED',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Broker limit exceeded',
  },
];

export class Migration20250117110439 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    this.addSql(queryGenerator.addTags(tags));
    this.addSql(
      queryGenerator.addTagToExistingGroup('INVOICE_ISSUES', tags[0].key),
    );
  }
  async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);
    const query = queryGenerator.removeTags(tags.map((tag) => tag.key));
    this.addSql(
      queryGenerator.removeTagFromExistingGroup('INVOICE_ISSUES', tags[0].key),
    );
    this.addSql(query);
  }
}
