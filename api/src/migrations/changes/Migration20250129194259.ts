import { Migration } from '@mikro-orm/migrations';

export class Migration20250129194259 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "broker_factoring_config" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "broker_id" uuid not null, "limit_amount" numeric null default null, constraint "broker_factoring_config_pkey" primary key ("id"));',
    );
    this.addSql(
      'comment on column "broker_factoring_config"."limit_amount" is \'Threshold for a broker\'\'s invoice amount in aging\';',
    );
    this.addSql(
      'create index "broker_factoring_config_created_at_index" on "broker_factoring_config" ("created_at");',
    );
    this.addSql(
      'create index "broker_factoring_config_broker_id_index" on "broker_factoring_config" ("broker_id");',
    );

    this.addSql(
      'create table "broker_limit_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) not null, "limit_amount" numeric null, "config_id" uuid not null, constraint "broker_limit_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_limit_assoc_created_at_index" on "broker_limit_assoc" ("created_at");',
    );
    this.addSql(
      'create index "broker_limit_assoc_config_id_index" on "broker_limit_assoc" ("config_id");',
    );

    this.addSql(
      'alter table "broker_factoring_config" add constraint "broker_factoring_config_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_factoring_config" add constraint "broker_factoring_config_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_limit_assoc" add constraint "broker_limit_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_limit_assoc" add constraint "broker_limit_assoc_config_id_foreign" foreign key ("config_id") references "broker_factoring_config" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "broker_limit_assoc" drop constraint "broker_limit_assoc_config_id_foreign";',
    );

    this.addSql('drop table if exists "broker_factoring_config" cascade;');

    this.addSql('drop table if exists "broker_limit_assoc" cascade;');
  }
}
