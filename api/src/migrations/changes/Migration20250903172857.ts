import { Migration, Query } from '@mikro-orm/migrations';
import { TagGroupBuilder } from '../utils/builders';
import { TagDefinitionGroupKey } from '@module-persistence/entities';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const removableTagsFromGroups = {
  INVOICE_ISSUES: ['BROKER_LIMIT_EXCEEDED', 'CLIENT_LIMIT_EXCEEDED'],
};

const internalInvoiceIssuesGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Internal Invoice Issues',
      key: 'INTERNAL_INVOICE_ISSUES' as TagDefinitionGroupKey,
    },
    [],
  );
};

export class Migration20250903172857 extends Migration {
  override async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);

    const tagGroupsQueries: Query[] = tagsQueryGenerator.createTagGroup(
      internalInvoiceIssuesGroupBuilder(),
    );
    for (const query of tagGroupsQueries) {
      this.addSql(query);
    }

    for (const [tagGroupKey, tagKeys] of Object.entries(
      removableTagsFromGroups,
    )) {
      for (const tagKey of tagKeys) {
        this.addSql(
          tagsQueryGenerator.removeTagFromExistingGroup(tagGroupKey, tagKey),
        );
        this.addSql(
          tagsQueryGenerator.addTagToExistingGroup(
            'INTERNAL_INVOICE_ISSUES',
            tagKey,
          ),
        );
      }
    }
  }

  override async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const [tagGroupKey, tagKeys] of Object.entries(
      removableTagsFromGroups,
    )) {
      for (const tagKey of tagKeys) {
        this.addSql(
          tagsQueryGenerator.removeTagFromExistingGroup(
            'INTERNAL_INVOICE_ISSUES',
            tagKey,
          ),
        );
        this.addSql(
          tagsQueryGenerator.addTagToExistingGroup(tagGroupKey, tagKey),
        );
      }
    }

    this.addSql(
      tagsQueryGenerator.removeTagGroups(['INTERNAL_INVOICE_ISSUES']),
    );
  }
}
