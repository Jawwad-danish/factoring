import { Migration } from '@mikro-orm/migrations';

export class Migration20250428120344 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "report_documents" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "report_name" text check ("report_name" in ('CLIENT_TOTAL_RESERVE')) not null, "storage_url" text not null, "worker_job_id" uuid not null, constraint "report_documents_pkey" primary key ("id"));`,
    );
    this.addSql(
      `comment on column "report_documents"."report_name" is 'The specific type of report generated (e.g., ClientTotalReserve).';`,
    );
    this.addSql(
      `comment on column "report_documents"."storage_url" is 'The storage URL where the generated report file is stored (s3 URL or file path).';`,
    );
    this.addSql(
      `create index "report_documents_created_at_index" on "report_documents" ("created_at");`,
    );
    this.addSql(
      `create index "report_documents_worker_job_id_index" on "report_documents" ("worker_job_id");`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "report_documents" add constraint "report_documents_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "report_documents" add constraint "report_documents_worker_job_id_foreign" foreign key ("worker_job_id") references "worker_jobs" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "report_documents" cascade;`);
  }
}
