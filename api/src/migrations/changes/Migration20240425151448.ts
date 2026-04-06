import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence';

export class Migration20240425151448 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    const query = tagsQueryGenerator.addTags(tags);
    this.addSql(query);
  }
  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    const query = tagsQueryGenerator.removeTags(tags.map((tag) => tag.key));
    this.addSql(query);
  }
}

const tags = [
  {
    name: 'Invoice document update',
    key: 'DOCUMENTS_UPDATE',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Client,
    level: TagDefinitionLevel.Info,
    note: 'Invoice document updated',
  },
];
