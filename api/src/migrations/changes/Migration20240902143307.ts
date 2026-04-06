import { Migration } from '@mikro-orm/migrations';

export class Migration20240902143307 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "invoices_history" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(0) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "entity_id" uuid not null, "entity_created_at" timestamptz(0) not null, "entity_record_status" text check ("entity_record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "operation_type" text check ("operation_type" in (\'create\', \'update\', \'delete\')) null default null, "client_id" uuid not null, "broker_id" uuid null, "display_id" varchar(255) not null, "buyout_id" varchar(255) null, "load_number" varchar(255) not null, "line_haul_rate" numeric not null, "lumper" numeric not null, "detention" numeric not null, "advance" numeric not null, "payment_date" timestamptz(0) null, "expedited" boolean not null, "accounts_receivable_value" numeric not null default 0, "value" numeric not null, "approved_factor_fee_percentage" numeric not null default 0, "approved_factor_fee" numeric not null default 0, "reserve_rate_percentage" numeric not null default 0, "reserve_fee" numeric not null default 0, "deduction" numeric not null default 0, "memo" varchar(255) null, "note" varchar(255) null, "status" text check ("status" in (\'purchased\', \'under_review\', \'rejected\')) not null, "rejected_date" timestamptz(0) null, "purchased_date" timestamptz(0) null, "broker_payment_status" text check ("broker_payment_status" in (\'shortpaid\', \'overpaid\', \'nonpayment\', \'in_full\', \'not_received\', \'non_factored_payment\')) not null default \'not_received\', "client_payment_status" text check ("client_payment_status" in (\'pending\', \'not_applicable\', \'in_progress\', \'sent\', \'failed\', \'completed\')) not null default \'not_applicable\', "verification_status" text check ("verification_status" in (\'required\', \'not_required\', \'verified\', \'bypassed\', \'in_progress\', \'failed\')) not null default \'required\', constraint "invoices_history_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoices_history_created_at_index" on "invoices_history" ("created_at");',
    );
    this.addSql(
      'create index "invoices_history_entity_id_index" on "invoices_history" ("entity_id");',
    );
    this.addSql(
      'create index "invoices_history_entity_created_at_index" on "invoices_history" ("entity_created_at");',
    );

    this.addSql(
      'alter table "invoices_history" add constraint "invoices_history_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "invoices_history" cascade;');
  }
}
