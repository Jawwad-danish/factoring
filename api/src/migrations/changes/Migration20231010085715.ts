import { Migration } from '@mikro-orm/migrations';

export class Migration20231010085715 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "invoices" add constraint "invoices_buyout_id_foreign" foreign key ("buyout_id") references "pending_buyouts" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "invoices" add constraint "invoices_buyout_id_unique" unique ("buyout_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "invoices" drop constraint "invoices_buyout_id_foreign";',
    );
    this.addSql(
      'alter table "invoices" drop constraint "invoices_buyout_id_unique";',
    );
  }
}
