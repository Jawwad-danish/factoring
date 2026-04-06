import { Migration } from '@mikro-orm/migrations';

export class Migration20251124112018 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "payment_order" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "client_id" uuid not null, "amount" numeric not null default 0, "transfer_type" text check ("transfer_type" in ('regular', 'expedite', 'wire', 'ach', 'rtp')) not null, "client_bank_account_id" uuid not null, "bank_account_last_digits" text null, constraint "payment_order_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "payment_order_created_at_index" on "payment_order" ("created_at");`,
    );
    this.addSql(
      `create index "payment_order_client_id_index" on "payment_order" ("client_id");`,
    );
    this.addSql(
      `create index "payment_order_client_bank_account_id_index" on "payment_order" ("client_bank_account_id");`,
    );

    this.addSql(
      `alter table "payment_order" add constraint "payment_order_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_order" cascade;`);
  }
}
