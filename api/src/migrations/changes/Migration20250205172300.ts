import { Migration } from '@mikro-orm/migrations';

export class Migration20250205172300 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "processing_notes" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid null, "broker_id" uuid null, "notes" varchar(255) not null, constraint "processing_notes_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "processing_notes_created_at_index" on "processing_notes" ("created_at");',
    );
    this.addSql(
      'create index "processing_notes_client_id_index" on "processing_notes" ("client_id");',
    );
    this.addSql(
      'create index "processing_notes_broker_id_index" on "processing_notes" ("broker_id");',
    );

    this.addSql(
      'alter table "processing_notes" add constraint "processing_notes_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "processing_notes" add constraint "processing_notes_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'drop table if exists "client_broker_processing_notes" cascade;',
    );

    this.addSql('drop table if exists "notifications" cascade;');

    this.addSql(
      'alter table "client_factoring_configs" drop column "processing_notes";',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'create table "client_broker_processing_notes" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "config_id" uuid not null default null, "broker_id" uuid not null default null, "notes" varchar not null default null, constraint "client_broker_processing_notes_pkey" primary key ("id"));',
    );
    this.addSql(
      'comment on column "client_broker_processing_notes"."notes" is \'Processing notes specific to a broker\';',
    );
    this.addSql(
      'create index "client_broker_processing_notes_broker_id_index" on "client_broker_processing_notes" ("broker_id");',
    );
    this.addSql(
      'create index "client_broker_processing_notes_config_id_index" on "client_broker_processing_notes" ("config_id");',
    );
    this.addSql(
      'create index "client_broker_processing_notes_created_at_index" on "client_broker_processing_notes" ("created_at");',
    );

    this.addSql(
      'create table "notifications" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "client_id" uuid not null default null, "medium" text check ("medium" in (\'email\', \'sms\')) not null default null, "recipient" varchar null default null, "sent_at" timestamptz null default null, "subject" varchar null default null, "message" varchar not null default null, "status" text check ("status" in (\'pending\', \'sent\', \'failed\', \'retrying\')) not null default \'pending\', constraint "notifications_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "notifications_client_id_index" on "notifications" ("client_id");',
    );
    this.addSql(
      'create index "notifications_created_at_index" on "notifications" ("created_at");',
    );

    this.addSql(
      'alter table "client_broker_processing_notes" add constraint "client_broker_processing_notes_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "client_broker_processing_notes" add constraint "client_broker_processing_notes_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "client_broker_processing_notes" add constraint "client_broker_processing_notes_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "notifications" add constraint "notifications_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "notifications" add constraint "notifications_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade on delete no action;',
    );

    this.addSql('drop table if exists "processing_notes" cascade;');

    this.addSql(
      'alter table "client_factoring_configs" add column "processing_notes" varchar null default \'\';',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."processing_notes" is \'General client notes used for processing\';',
    );
  }
}
