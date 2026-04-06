import { Migration } from '@mikro-orm/migrations';

export class Migration20250113083323 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "client_limit_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) not null, "client_limit_amount" numeric null, "config_id" uuid not null, constraint "client_limit_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_limit_assoc_created_at_index" on "client_limit_assoc" ("created_at");',
    );
    this.addSql(
      'create index "client_limit_assoc_config_id_index" on "client_limit_assoc" ("config_id");',
    );

    this.addSql(
      'alter table "client_limit_assoc" add constraint "client_limit_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_limit_assoc" add constraint "client_limit_assoc_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_factoring_configs_history" add column "client_limit_amount" numeric null;',
    );

    this.addSql(
      'alter table "client_factoring_configs" add column "client_limit_amount" numeric null;',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."client_limit_amount" is \'Threshold for a client\'\'s invoice amount in aging\';',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'create table "peruse_jobs" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "invoice_id" uuid not null default null, "job_id" uuid not null default null, "type" text check ("type" in (\'classification\', \'verify_load\', \'create_load\')) not null default null, "status" text check ("status" in (\'in_progress\', \'done\')) not null default \'in_progress\', "response" jsonb null default null, "request" jsonb not null default null, constraint "peruse_jobs_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "peruse_jobs_created_at_index" on "peruse_jobs" ("created_at");',
    );
    this.addSql(
      'create index "peruse_jobs_invoice_id_index" on "peruse_jobs" ("invoice_id");',
    );

    this.addSql(
      'alter table "peruse_jobs" add constraint "peruse_jobs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "peruse_jobs" add constraint "peruse_jobs_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade on delete no action;',
    );

    this.addSql('drop table if exists "client_limit_assoc" cascade;');

    this.addSql(
      'alter table "client_factoring_configs" drop column "client_limit_amount";',
    );

    this.addSql(
      'alter table "client_factoring_configs_history" drop column "client_limit_amount";',
    );
  }
}
