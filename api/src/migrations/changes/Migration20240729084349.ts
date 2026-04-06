import { Migration } from '@mikro-orm/migrations';

export class Migration20240729084349 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "documents" alter column "internal_url" type text using ("internal_url"::text);',
    );
    this.addSql(
      'alter table "documents" alter column "external_url" type text using ("external_url"::text);',
    );
    this.addSql(
      'alter table "documents" alter column "thumbnail_url" type text using ("thumbnail_url"::text);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "documents" alter column "internal_url" type varchar using ("internal_url"::varchar);',
    );
    this.addSql(
      'alter table "documents" alter column "external_url" type varchar using ("external_url"::varchar);',
    );
    this.addSql(
      'alter table "documents" alter column "thumbnail_url" type varchar using ("thumbnail_url"::varchar);',
    );
  }
}
