import { Migration } from '@mikro-orm/migrations';

export class Migration20250121092932 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "client_broker_processing_notes" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "config_id" uuid not null, "broker_id" uuid not null, "notes" varchar(255) not null, constraint "client_broker_processing_notes_pkey" primary key ("id"));',
    );
    this.addSql(
      'comment on column "client_broker_processing_notes"."notes" is \'Processing notes specific to a broker\';',
    );
    this.addSql(
      'create index "client_broker_processing_notes_created_at_index" on "client_broker_processing_notes" ("created_at");',
    );
    this.addSql(
      'create index "client_broker_processing_notes_config_id_index" on "client_broker_processing_notes" ("config_id");',
    );
    this.addSql(
      'create index "client_broker_processing_notes_broker_id_index" on "client_broker_processing_notes" ("broker_id");',
    );

    this.addSql(
      'alter table "client_broker_processing_notes" add constraint "client_broker_processing_notes_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_broker_processing_notes" add constraint "client_broker_processing_notes_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_broker_processing_notes" add constraint "client_broker_processing_notes_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_factoring_configs_history" add column "processing_notes" varchar(255) null default \'\';',
    );
    this.addSql(
      'comment on column "client_factoring_configs_history"."processing_notes" is \'General client notes used for processing\';',
    );

    this.addSql(
      'alter table "client_factoring_configs" add column "processing_notes" varchar(255) null default \'\';',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."processing_notes" is \'General client notes used for processing\';',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'drop table if exists "client_broker_processing_notes" cascade;',
    );

    this.addSql(
      'alter table "client_factoring_configs" drop column "processing_notes";',
    );

    this.addSql(
      'alter table "client_factoring_configs_history" drop column "processing_notes";',
    );
  }
}
