import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence';

const tags = [
  {
    name: 'Advance taken',
    key: 'ADVANCE_TAKEN',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Advance was taken',
  },
];

export class Migration20250212134913 extends Migration {
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
