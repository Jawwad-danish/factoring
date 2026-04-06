import { Migration } from '@mikro-orm/migrations';

export class Migration20240509073842 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "documents" add column "thumbnail_url" varchar(255) null;',
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "documents" drop column "thumbnail_url";');
  }
}
