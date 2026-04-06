import { Migration } from '@mikro-orm/migrations';

export class Migration20240222123533 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "client_factoring_rate_reasons" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "reason" text check ("reason" in (\'rate_correction\', \'rate_increase\', \'lower_rate_request\', \'none\')) not null default \'none\', constraint "client_factoring_rate_reasons_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_factoring_rate_reasons_created_at_index" on "client_factoring_rate_reasons" ("created_at");',
    );

    this.addSql(
      'create table "client_factoring_rate_reasons_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) not null, "factoring_rate_percentage" numeric not null, "reason_id" uuid not null, "config_id" uuid not null, constraint "client_factoring_rate_reasons_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_factoring_rate_reasons_assoc_created_at_index" on "client_factoring_rate_reasons_assoc" ("created_at");',
    );
    this.addSql(
      'create index "client_factoring_rate_reasons_assoc_reason_id_index" on "client_factoring_rate_reasons_assoc" ("reason_id");',
    );
    this.addSql(
      'create index "client_factoring_rate_reasons_assoc_config_id_index" on "client_factoring_rate_reasons_assoc" ("config_id");',
    );

    this.addSql(
      'alter table "client_factoring_rate_reasons" add constraint "client_factoring_rate_reasons_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_factoring_rate_reasons" add constraint "client_factoring_rate_reasons_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_factoring_rate_reasons_assoc" add constraint "client_factoring_rate_reasons_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_factoring_rate_reasons_assoc" add constraint "client_factoring_rate_reasons_assoc_reason_id_foreign" foreign key ("reason_id") references "client_factoring_rate_reasons" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_factoring_rate_reasons_assoc" add constraint "client_factoring_rate_reasons_assoc_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_rate_reasons_assoc" drop constraint "client_factoring_rate_reasons_assoc_reason_id_foreign";',
    );

    this.addSql(
      'drop table if exists "client_factoring_rate_reasons" cascade;',
    );

    this.addSql(
      'drop table if exists "client_factoring_rate_reasons_assoc" cascade;',
    );
  }
}
