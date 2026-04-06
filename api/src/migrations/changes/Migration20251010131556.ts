import { Migration } from '@mikro-orm/migrations';

export class Migration20251010131556 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "quickbooks_tokens" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "encrypted_token" text not null, constraint "quickbooks_tokens_pkey" primary key ("id"));`,
    );
    this.addSql(
      `comment on column "quickbooks_tokens"."encrypted_token" is 'Quickbooks API encrypted token';`,
    );
    this.addSql(
      `create index "quickbooks_tokens_created_at_index" on "quickbooks_tokens" ("created_at");`,
    );

    this.addSql(
      `alter table "quickbooks_tokens" add constraint "quickbooks_tokens_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_tokens" add constraint "quickbooks_tokens_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "quickbooks_tokens" cascade;`);
  }
}
