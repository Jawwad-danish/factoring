import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';
import { TagsQueryGenerator } from '../utils';

const verifyInvoiceTags = [
  {
    name: 'Verify invoice',
    key: 'VERIFY_INVOICE' as TagDefinitionKey,
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Warning,
    note: 'Invoice verify action',
  },
];

export class Migration20230831142141 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const query = tagsQueryGenerator.addTags(verifyInvoiceTags);
    this.addSql(query);
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const query = tagsQueryGenerator.removeTags(
      verifyInvoiceTags.map((tag) => tag.key),
    );
    this.addSql(query);
  }
}
