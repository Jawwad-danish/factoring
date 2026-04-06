import { Migration } from '@mikro-orm/migrations';

export class Migration20241119195102 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "broker_payments_history" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "entity_id" uuid not null, "entity_created_at" timestamptz(0) not null, "entity_record_status" text check ("entity_record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "operation_type" text check ("operation_type" in (\'create\', \'update\', \'delete\')) null default null, "invoice_id" uuid not null, "type" text check ("type" in (\'ACH\', \'Check\')) null, "amount" numeric not null, "check_number" varchar(255) null, "batch_date" timestamptz(0) not null, constraint "broker_payments_history_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_payments_history_created_at_index" on "broker_payments_history" ("created_at");',
    );
    this.addSql(
      'create index "broker_payments_history_entity_id_index" on "broker_payments_history" ("entity_id");',
    );
    this.addSql(
      'create index "broker_payments_history_entity_created_at_index" on "broker_payments_history" ("entity_created_at");',
    );
    this.addSql(
      'create index "broker_payments_history_invoice_id_index" on "broker_payments_history" ("invoice_id");',
    );

    this.addSql(
      'create table "client_factoring_configs_history" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "entity_id" uuid not null, "entity_created_at" timestamptz(0) not null, "entity_record_status" text check ("entity_record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "operation_type" text check ("operation_type" in (\'create\', \'update\', \'delete\')) null default null, "client_id" uuid not null, "factoring_rate_percentage" numeric not null, "reserve_rate_percentage" numeric not null, "verification_percentage" numeric not null, "vip" boolean not null default false, "expedite_transfer_only" boolean not null default false, "done_submitting_invoices" boolean not null default false, "client_success_team_id" uuid not null, "status" text check ("status" in (\'active\', \'onboarding\', \'hold\', \'released\')) not null default \'onboarding\', "user_id" uuid not null, "accepted_fee_increase" boolean not null, "cc_in_emails" boolean not null, constraint "client_factoring_configs_history_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_factoring_configs_history_created_at_index" on "client_factoring_configs_history" ("created_at");',
    );
    this.addSql(
      'create index "client_factoring_configs_history_entity_id_index" on "client_factoring_configs_history" ("entity_id");',
    );
    this.addSql(
      'create index "client_factoring_configs_history_entity_created_at_index" on "client_factoring_configs_history" ("entity_created_at");',
    );
    this.addSql(
      'create index "client_factoring_configs_history_client_id_index" on "client_factoring_configs_history" ("client_id");',
    );

    this.addSql(
      'create table "users_history" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "entity_id" uuid not null, "entity_created_at" timestamptz(0) not null, "entity_record_status" text check ("entity_record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "operation_type" text check ("operation_type" in (\'create\', \'update\', \'delete\')) null default null, "external_id" varchar(255) null, "email" varchar(255) not null, "first_name" varchar(255) null, "last_name" varchar(255) null, constraint "users_history_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "users_history_created_at_index" on "users_history" ("created_at");',
    );
    this.addSql(
      'create index "users_history_entity_id_index" on "users_history" ("entity_id");',
    );
    this.addSql(
      'create index "users_history_entity_created_at_index" on "users_history" ("entity_created_at");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "broker_payments_history" cascade;');
    this.addSql(
      'drop table if exists "client_factoring_configs_history" cascade;',
    );
    this.addSql('drop table if exists "users_history" cascade;');
  }
}
