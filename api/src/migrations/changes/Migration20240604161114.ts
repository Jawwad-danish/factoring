import { Migration } from '@mikro-orm/migrations';

export class Migration20240604161114 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "reserve_account_funds" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "client_id" uuid not null, "amount" numeric not null default 0, "note" text not null, constraint "reserve_account_funds_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "reserve_account_funds_created_at_index" on "reserve_account_funds" ("created_at");',
    );
    this.addSql(
      'create index "reserve_account_funds_client_id_index" on "reserve_account_funds" ("client_id");',
    );
    this.addSql(
      'alter table "reserve_account_funds" add constraint "reserve_account_funds_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "reserve_account_funds" cascade;');
  }
}
