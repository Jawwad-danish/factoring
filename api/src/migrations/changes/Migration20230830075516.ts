import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';
import { TagsQueryGenerator } from '../utils';
export class Migration20230830075516 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const query = tagsQueryGenerator.addTags(pdfTags);
    this.addSql(query);

    for (const tag of pdfTags) {
      const assocQuery = tagsQueryGenerator.addTagToExistingGroup(
        'INVOICE_ISSUES',
        tag.key,
      );
      this.addSql(assocQuery);
    }
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    for (const tag of pdfTags) {
      const assocQuery = tagsQueryGenerator.removeTagFromExistingGroup(
        'INVOICE_ISSUES',
        tag.key,
      );
      this.addSql(assocQuery);
    }
    const query = tagsQueryGenerator.removeTags(pdfTags.map((tag) => tag.key));
    this.addSql(query);
  }
}

const pdfTags = [
  {
    name: 'Invoice PDF Failure',
    key: 'INVOICE_PDF_FAILURE' as TagDefinitionKey,
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Invoice PDF Failure',
  },
  {
    name: 'Invoice PDF In Progress',
    key: 'INVOICE_PDF_IN_PROGRESS' as TagDefinitionKey,
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Invoice PDF in progress',
  },
];
