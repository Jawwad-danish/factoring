import { Migration } from '@mikro-orm/migrations';

export class Migration20240405135825 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "invoice_activity_log" alter column "note" type text using ("note"::text);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "invoice_activity_log" alter column "note" type varchar using ("note"::varchar);',
    );
  }
}
