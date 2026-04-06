import { Migration, Query } from '@mikro-orm/migrations';
import { TagDefinitionGroupKey } from '@module-persistence/entities';
import { TagsQueryGenerator } from '../utils';
import { TagGroupBuilder } from '../utils/builders';

const removableTagsFromGroups = {
  INVOICE_ISSUES: ['INVOICE_PDF_IN_PROGRESS', 'INVOICE_PDF_FAILURE'],
};

const technicalIssuesGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Technical issues',
      key: 'TECHNICAL_ISSUES' as TagDefinitionGroupKey,
    },
    [],
  );
};

export class Migration20231003104328 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const tagGroupsQueries: Query[] = tagsQueryGenerator.createTagGroup(
      technicalIssuesGroupBuilder(),
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
          tagsQueryGenerator.addTagToExistingGroup('TECHNICAL_ISSUES', tagKey),
        );
      }
    }
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    for (const [tagGroupKey, tagKeys] of Object.entries(
      removableTagsFromGroups,
    )) {
      for (const tagKey of tagKeys) {
        this.addSql(
          tagsQueryGenerator.removeTagFromExistingGroup(
            'TECHNICAL_ISSUES',
            tagKey,
          ),
        );
        this.addSql(
          tagsQueryGenerator.addTagToExistingGroup(tagGroupKey, tagKey),
        );
      }
    }
    this.addSql(tagsQueryGenerator.removeTagGroups(['TECHNICAL_ISSUES']));
  }
}
