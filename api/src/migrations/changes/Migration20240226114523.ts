import { Migration } from '@mikro-orm/migrations';

export class Migration20240226114523 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "reserves_invoice" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "invoice_id" uuid null, "reserve_id" uuid null, constraint "reserves_invoice_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "reserves_invoice_created_at_index" on "reserves_invoice" ("created_at");',
    );
    this.addSql(
      'create index "reserves_invoice_invoice_id_index" on "reserves_invoice" ("invoice_id");',
    );
    this.addSql(
      'alter table "reserves_invoice" add constraint "reserves_invoice_reserve_id_unique" unique ("reserve_id");',
    );

    this.addSql(
      'alter table "reserves_invoice" add constraint "reserves_invoice_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "reserves_invoice" add constraint "reserves_invoice_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "reserves_invoice" add constraint "reserves_invoice_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "reserves_invoice" add constraint "reserves_invoice_reserve_id_foreign" foreign key ("reserve_id") references "reserves" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "reserves" drop constraint if exists "reserves_reason_check";',
    );

    this.addSql(
      'alter table "reserves" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"reserves\" add constraint \"reserves_reason_check\" check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment', 'buyout fee', 'reserve (entry)', 'reserve (entry) removed'));",
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "reserves_invoice" cascade;');

    this.addSql(
      'alter table "reserves" drop constraint if exists "reserves_reason_check";',
    );

    this.addSql(
      'alter table "reserves" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"reserves\" add constraint \"reserves_reason_check\" check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment', 'buyout fee', 'reserve (entry)'));",
    );
  }
}
