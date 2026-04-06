import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

export class Migration20240306153530 extends Migration {
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
    name: 'Client payment update',
    key: 'CLIENT_PAYMENT_UPDATE',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Info,
    note: 'Client payment updated',
  },
  {
    name: 'Client payment failed',
    key: 'CLIENT_PAYMENT_FAILED',
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Client payment failed',
  },
];
