import { Migration } from '@mikro-orm/migrations';

export class Migration20240221133900 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "client_reserve_rate_reasons" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "reason" text check ("reason" in (\'dillution_rate\', \'volume\', \'high_risk_brokers\', \'general_risk\', \'other\')) not null default \'other\', constraint "client_reserve_rate_reasons_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_reserve_rate_reasons_created_at_index" on "client_reserve_rate_reasons" ("created_at");',
    );

    this.addSql(
      'create table "client_reserve_rate_reasons_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) not null, "client_id" uuid not null, "reserve_rate_percentage" numeric not null, "reserve_rate_reason_id" uuid not null, constraint "client_reserve_rate_reasons_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_reserve_rate_reasons_assoc_created_at_index" on "client_reserve_rate_reasons_assoc" ("created_at");',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons" add constraint "client_reserve_rate_reasons_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_reserve_rate_reasons" add constraint "client_reserve_rate_reasons_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" add constraint "client_reserve_rate_reasons_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" add constraint "client_reserve_rate_reasons_assoc_reserve_rate_reason_id_foreign" foreign key ("reserve_rate_reason_id") references "client_reserve_rate_reasons" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves" drop constraint if exists "reserves_reason_check";',
    );

    this.addSql(
      'alter table "reserves" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"reserves\" add constraint \"reserves_reason_check\" check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment', 'buyout fee', 'reserve (entry)'));",
    );

    this.addSql(
      'alter table "invoices" add column "reserve_rate_percentage" numeric not null default 0, add column "reserve_fee" numeric not null default 0;',
    );

    this.addSql(
      'alter table "client_factoring_configs" add column "reserve_rate_percentage" numeric not null default 0;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" drop constraint "client_reserve_rate_reasons_assoc_reserve_rate_reason_id_foreign";',
    );

    this.addSql('drop table if exists "client_reserve_rate_reasons" cascade;');

    this.addSql(
      'drop table if exists "client_reserve_rate_reasons_assoc" cascade;',
    );

    this.addSql(
      'alter table "reserves" drop constraint if exists "reserves_reason_check";',
    );

    this.addSql(
      'alter table "client_factoring_configs" drop column "reserve_rate_percentage";',
    );

    this.addSql(
      'alter table "invoices" drop column "reserve_rate_percentage";',
    );
    this.addSql('alter table "invoices" drop column "reserve_fee";');

    this.addSql(
      'alter table "reserves" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"reserves\" add constraint \"reserves_reason_check\" check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment', 'buyout fee'));",
    );
  }
}
