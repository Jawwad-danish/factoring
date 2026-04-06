import { Migration } from '@mikro-orm/migrations';

export class Migration20250915134815 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "audit_log" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "type" text check ("type" in ('broker_payment', 'quickbooks')) not null, "note" text not null, "payload" jsonb not null, constraint "audit_log_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "audit_log_created_at_index" on "audit_log" ("created_at");`,
    );

    this.addSql(
      `alter table "audit_log" add constraint "audit_log_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audit_log" cascade;`);
  }
}
