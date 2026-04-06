import { Migration } from '@mikro-orm/migrations';

export class Migration20241121072416 extends Migration {
  async up(): Promise<void> {
    this.addSql('drop table if exists "database_audit_log" cascade;');

    this.addSql(
      'alter table "request_storage" add column "created_by" uuid null default null, add column "correlation_id" uuid null default null;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'create table "database_audit_log" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "table" varchar not null default null, "operation" text check ("operation" in (\'CREATE\', \'UPDATE\', \'DELETE\', \'SOFT_DELETE\', \'REACTIVATE\')) not null default null, "serialized_row" jsonb not null default null, "entity_id" uuid null default null, constraint "database_audit_log_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "database_audit_log_created_at_index" on "database_audit_log" ("created_at");',
    );
    this.addSql(
      'create index "database_audit_log_entity_id_index" on "database_audit_log" ("entity_id");',
    );

    this.addSql('alter table "request_storage" drop column "created_by";');
    this.addSql('alter table "request_storage" drop column "correlation_id";');
  }
}
