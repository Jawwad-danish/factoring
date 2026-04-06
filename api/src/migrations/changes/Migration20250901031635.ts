import { Migration } from '@mikro-orm/migrations';

export class Migration20250901031635 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "firebase_tokens" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "user_id" uuid not null, "token" varchar(255) not null, constraint "firebase_tokens_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "firebase_tokens_created_at_index" on "firebase_tokens" ("created_at");`,
    );
    this.addSql(
      `create index "firebase_tokens_user_id_index" on "firebase_tokens" ("user_id");`,
    );

    this.addSql(
      `alter table "firebase_tokens" add constraint "firebase_tokens_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "firebase_tokens" add constraint "firebase_tokens_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "firebase_tokens" add constraint "firebase_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "firebase_tokens" cascade;`);
  }
}
