import { Migration } from '@mikro-orm/migrations';

export class Migration20250819083234 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "client_factoring_configs" drop constraint "client_factoring_configs_sales_rep_id_foreign";`,
    );

    this.addSql(
      `alter table "client_factoring_configs" add constraint "client_factoring_configs_sales_rep_id_foreign" foreign key ("sales_rep_id") references "employees" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "client_factoring_configs" drop constraint "client_factoring_configs_sales_rep_id_foreign";`,
    );

    this.addSql(
      `alter table "client_factoring_configs" add constraint "client_factoring_configs_sales_rep_id_foreign" foreign key ("sales_rep_id") references "users" ("id") on update cascade on delete set null;`,
    );
  }
}
