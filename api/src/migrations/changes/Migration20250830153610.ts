import { Migration } from '@mikro-orm/migrations';

export class Migration20250830153610 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "emails" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "external_identifier" varchar(255) not null, "from" varchar(255) not null, "to" text[] not null, "cc" text[] null, "bcc" text[] null, "subject" text not null, "body" text not null, "html" boolean not null default false, "verified_send" boolean not null default false, "verified_reject" boolean not null default false, "verified_delivery" boolean not null default false, "verified_bounce" boolean not null default false, "verified_complaint" boolean not null default false, "verified_click" boolean not null default false, "verified_open" boolean not null default false, "payload" jsonb null, constraint "emails_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "emails_created_at_index" on "emails" ("created_at");`,
    );

    this.addSql(
      `alter table "emails" add constraint "emails_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "emails" add constraint "emails_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "emails" cascade;`);
  }
}
