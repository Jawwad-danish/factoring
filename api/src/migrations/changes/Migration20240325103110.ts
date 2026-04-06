import { Migration } from '@mikro-orm/migrations';

export class Migration20240325103110 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "reserves" alter column "note" type text using ("note"::text);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "reserves" alter column "note" type varchar using ("note"::varchar);',
    );
  }
}
