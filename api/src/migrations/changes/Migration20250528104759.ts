import { Migration } from '@mikro-orm/migrations';

export class Migration20250528104759 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table "notifications" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid not null, "medium" text check ("medium" in ('email', 'sms')) not null, "recipient" varchar(255) null, "sent_at" timestamptz null, "subject" varchar(255) null, "message" varchar(255) not null, "status" text check ("status" in ('pending', 'sent', 'failed', 'retrying')) not null default 'pending', constraint "notifications_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "notifications_created_at_index" on "notifications" ("created_at");`,
    );
    this.addSql(
      `create index "notifications_client_id_index" on "notifications" ("client_id");`,
    );

    this.addSql(
      `alter table "notifications" add constraint "notifications_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "notifications" add constraint "notifications_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "notifications" cascade;`);
  }
}
