import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

const tags = ['INVOICE_PDF_IN_PROGRESS', 'INVOICE_PDF_FAILURE'];
export class Migration20250913072959 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "tag_definitions" drop constraint if exists "tag_definitions_visibility_check";`,
    );
    this.addSql(
      `alter table "tag_definitions" add constraint "tag_definitions_visibility_check" check("visibility" in ('client', 'employee', 'all', 'internal'));`,
    );

    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const tag of tags) {
      this.addSql(
        tagsQueryGenerator.updateTag(tag, {
          visibility: 'internal',
        }),
      );
      this.addSql(
        tagsQueryGenerator.removeTagFromExistingGroup('INVOICE_ISSUES', tag),
      );
      this.addSql(
        tagsQueryGenerator.addTagToExistingGroup(
          'INTERNAL_INVOICE_ISSUES',
          tag,
        ),
      );
    }
  }

  override async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGeneratorV2(this.driver);
    for (const tag of tags) {
      this.addSql(
        tagsQueryGenerator.updateTag(tag, {
          visibility: 'employee',
        }),
      );
      this.addSql(
        tagsQueryGenerator.removeTagFromExistingGroup(
          'INTERNAL_INVOICE_ISSUES',
          tag,
        ),
      );
      this.addSql(
        tagsQueryGenerator.addTagToExistingGroup('INVOICE_ISSUES', tag),
      );
    }

    this.addSql(
      `alter table "tag_definitions" drop constraint if exists "tag_definitions_visibility_check";`,
    );
    this.addSql(
      `alter table "tag_definitions" add constraint "tag_definitions_visibility_check" check("visibility" in ('client', 'employee', 'all'));`,
    );
  }
}
