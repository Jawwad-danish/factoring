import { Migration } from '@mikro-orm/migrations';

export class Migration20250711100658 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "employees" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "role" text check ("role" in ('account_manager', 'underwriter', 'collections_specialist', 'processor', 'master', 'salesperson')) null, "extension" varchar(255) null, "user_id" uuid not null, constraint "employees_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "employees_created_at_index" on "employees" ("created_at");`,
    );
    this.addSql(
      `create index "employees_user_id_index" on "employees" ("user_id");`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_user_id_unique" unique ("user_id");`,
    );

    this.addSql(
      `alter table "employees" add constraint "employees_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "employees" cascade;`);
  }
}
