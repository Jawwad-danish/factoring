import { Migration } from '@mikro-orm/migrations';

export class Migration20250409211529 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "processing_notes" alter column "notes" type text using ("notes"::text);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "processing_notes" alter column "notes" type varchar using ("notes"::varchar);',
    );
  }
}
