import { Migration } from '@mikro-orm/migrations';

export class Migration20250702035458 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "client_broker_assignment_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "note" text null, "status" text check ("status" in ('sent', 'verified', 'released')) null, "client_broker_assignment_id" uuid not null, constraint "client_broker_assignment_assoc_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "client_broker_assignment_assoc_created_at_index" on "client_broker_assignment_assoc" ("created_at");`,
    );
    this.addSql(
      `create index "client_broker_assignment_assoc_client_broker_assig_1d99b_index" on "client_broker_assignment_assoc" ("client_broker_assignment_id");`,
    );

    this.addSql(
      `alter table "client_broker_assignment_assoc" add constraint "client_broker_assignment_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "client_broker_assignment_assoc" add constraint "client_broker_assignment_assoc_client_broker_ass_815f3_foreign" foreign key ("client_broker_assignment_id") references "client_broker_assignments" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop table if exists "client_broker_assignment_assoc" cascade;`,
    );
  }
}
