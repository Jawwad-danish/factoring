import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const tags = [
  {
    name: 'Email sent',
    key: 'EMAIL_SENT',
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Info,
    note: 'Email sent',
  },
];

export class Migration20250830153610 extends Migration {
  override async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    const query = tagsQueryGenerator.addTags(tags);
    this.addSql(query);
  }

  override async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    const query = tagsQueryGenerator.removeTags(tags.map((tag) => tag.key));
    this.addSql(query);
  }
}
