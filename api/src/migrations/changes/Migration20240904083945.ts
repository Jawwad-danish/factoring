import { Migration } from '@mikro-orm/migrations';

export class Migration20240904083945 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "invoices_history" drop constraint "invoices_history_created_by_id_foreign";',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "invoices_history" add constraint "invoices_history_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete no action;',
    );
  }
}
