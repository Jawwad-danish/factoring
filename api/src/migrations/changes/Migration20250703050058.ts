import { Migration } from '@mikro-orm/migrations';

export class Migration20250703050058 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "assignments_changelog_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "changelog_notes" text not null, "description" text null, "assignment_assoc_history_id" uuid not null, constraint "assignments_changelog_assoc_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "assignments_changelog_assoc_created_at_index" on "assignments_changelog_assoc" ("created_at");`,
    );
    this.addSql(
      `create index "assignments_changelog_assoc_assignment_assoc_history_id_index" on "assignments_changelog_assoc" ("assignment_assoc_history_id");`,
    );

    this.addSql(
      `alter table "assignments_changelog_assoc" add constraint "assignments_changelog_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "assignments_changelog_assoc" add constraint "assignments_changelog_assoc_assignment_assoc_history_id_foreign" foreign key ("assignment_assoc_history_id") references "client_broker_assignment_assoc" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "client_broker_assignment_assoc" add column "changelog_notes" text null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "assignments_changelog_assoc" cascade;`);

    this.addSql(
      `alter table "client_broker_assignment_assoc" drop column "changelog_notes";`,
    );
  }
}
