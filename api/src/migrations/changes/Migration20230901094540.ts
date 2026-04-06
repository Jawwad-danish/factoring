import { Migration } from '@mikro-orm/migrations';

export class Migration20230901094540 extends Migration {
  async up(): Promise<void> {
    this.buildClientSuccessTeamTable();
    this.updateClientFactoringConfigs();

    this.addSql(
      'alter table "tag_definitions" alter column "used_by" type text[] using ("used_by"::text[]);',
    );
  }

  private buildClientSuccessTeamTable() {
    this.addSql(
      'create table "client_success_teams" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, constraint "client_success_teams_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_success_teams_created_at_index" on "client_success_teams" ("created_at");',
    );
    this.addSql(
      'create index "client_success_teams_name_index" on "client_success_teams" ("name");',
    );
    this.addSql(
      'alter table "client_success_teams" add constraint "client_success_teams_name_unique" unique ("name");',
    );
  }

  private updateClientFactoringConfigs() {
    this.addSql(
      'alter table "client_factoring_configs" add column "client_success_team_id" uuid;',
    );
    this.addSql(
      'alter table "client_factoring_configs" alter column "client_success_team_id" set not null',
    );
    this.addSql(
      'alter table "client_factoring_configs" add constraint "client_factoring_configs_client_success_team_id_foreign" foreign key ("client_success_team_id") references "client_success_teams" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" drop column "client_success_team_id";',
    );
    this.addSql('drop table "client_success_teams";');
    this.addSql(
      'alter table "tag_definitions" alter column "used_by" type text[] using ("used_by"::text[]);',
    );
  }
}
