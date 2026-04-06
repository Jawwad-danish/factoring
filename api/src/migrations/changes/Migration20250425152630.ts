import { Migration } from '@mikro-orm/migrations';

export class Migration20250425152630 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "worker_jobs" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "type" text check ("type" in ('REPORT')) not null, "payload" jsonb not null, "status" text check ("status" in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) not null default 'PENDING', "attempts" int not null default 0, "max_attempts" int not null default 3, "last_attempt_at" timestamptz null, "finished_at" timestamptz null, "error_message" text null, constraint "worker_jobs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "worker_jobs_created_at_index" on "worker_jobs" ("created_at");`,
    );
    this.addSql(
      `create index "worker_jobs_type_index" on "worker_jobs" ("type");`,
    );

    this.addSql(
      `alter table "worker_jobs" add constraint "worker_jobs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "worker_jobs" add constraint "worker_jobs_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "worker_jobs" cascade;`);
  }
}
