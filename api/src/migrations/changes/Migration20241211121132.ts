import { Migration } from '@mikro-orm/migrations';

export class Migration20241211121132 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "peruse_jobs" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "invoice_id" uuid not null, "job_id" uuid not null, "type" text check ("type" in (\'classification\', \'verify_load\', \'create_load\')) not null, "status" text check ("status" in (\'in_progress\', \'done\')) not null default \'in_progress\', "response" jsonb null, "request" jsonb not null, constraint "peruse_jobs_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "peruse_jobs_created_at_index" on "peruse_jobs" ("created_at");',
    );
    this.addSql(
      'create index "peruse_jobs_invoice_id_index" on "peruse_jobs" ("invoice_id");',
    );
    this.addSql(
      'alter table "peruse_jobs" add constraint "peruse_jobs_job_id_unique" unique ("job_id");',
    );

    this.addSql(
      'alter table "peruse_jobs" add constraint "peruse_jobs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "peruse_jobs" add constraint "peruse_jobs_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "peruse_jobs" cascade;');
  }
}
