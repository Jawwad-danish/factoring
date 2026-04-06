import { Migration } from '@mikro-orm/migrations';

export class Migration20251010091555 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "quickbooks_journal_entries" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "doc_name" text not null, "quickbooks_id" text null, "synced_at" timestamptz(3) null, "type" text check ("type" in ('batch_payment', 'reserve', 'broker_payment')) not null, "business_day" text not null, "status" text check ("status" in ('pending', 'synced', 'failed')) not null default 'pending', constraint "quickbooks_journal_entries_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "quickbooks_journal_entries_created_at_index" on "quickbooks_journal_entries" ("created_at");`,
    );
    this.addSql(
      `create index "quickbooks_journal_entries_doc_name_index" on "quickbooks_journal_entries" ("doc_name");`,
    );
    this.addSql(
      `create index "quickbooks_journal_entries_quickbooks_id_index" on "quickbooks_journal_entries" ("quickbooks_id");`,
    );

    this.addSql(
      `create table "quickbooks_accounts" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "key" text check ("key" in ('REVENUE', 'FACTORING_AR', 'OUTGOING_CASH', 'INCOMING_CASH', 'CUSTOMER_CREDIT', 'OTHER_CURRENT_ASSETS', 'FEE_REVENUE', 'BAD_DEBT_EXPENSE')) not null, "name" text null, "number" text null, "type" text null, "sub_type" text null, "quickbooks_id" text null, constraint "quickbooks_accounts_pkey" primary key ("id"));`,
    );
    this.addSql(
      `comment on column "quickbooks_accounts"."key" is 'Internal account key';`,
    );
    this.addSql(
      `comment on column "quickbooks_accounts"."name" is 'Account name';`,
    );
    this.addSql(
      `comment on column "quickbooks_accounts"."number" is 'Account number';`,
    );
    this.addSql(
      `comment on column "quickbooks_accounts"."type" is 'Account type';`,
    );
    this.addSql(
      `comment on column "quickbooks_accounts"."sub_type" is 'Account sub-type';`,
    );
    this.addSql(
      `comment on column "quickbooks_accounts"."quickbooks_id" is 'Quickbooks API account id';`,
    );
    this.addSql(
      `create index "quickbooks_accounts_created_at_index" on "quickbooks_accounts" ("created_at");`,
    );
    this.addSql(
      `create index "quickbooks_accounts_key_index" on "quickbooks_accounts" ("key");`,
    );
    this.addSql(
      `alter table "quickbooks_accounts" add constraint "quickbooks_accounts_key_unique" unique ("key");`,
    );
    this.addSql(
      `create index "quickbooks_accounts_quickbooks_id_index" on "quickbooks_accounts" ("quickbooks_id");`,
    );

    this.addSql(
      `create table "quickbooks_journal_entry_lines" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "account_id" uuid not null, "type" text check ("type" in ('debit', 'credit')) not null, "amount" numeric not null default 0, "journal_entry_id" uuid not null, "client_id" uuid null, "note" text not null default '', "client_payment_id" uuid null, "broker_payment_id" uuid null, "batch_payment_id" uuid null, "reserve_id" uuid null, "invoice_id" uuid null, constraint "quickbooks_journal_entry_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "quickbooks_journal_entry_lines_created_at_index" on "quickbooks_journal_entry_lines" ("created_at");`,
    );
    this.addSql(
      `create index "quickbooks_journal_entry_lines_account_id_index" on "quickbooks_journal_entry_lines" ("account_id");`,
    );
    this.addSql(
      `create index "quickbooks_journal_entry_lines_journal_entry_id_index" on "quickbooks_journal_entry_lines" ("journal_entry_id");`,
    );
    this.addSql(
      `create index "quickbooks_journal_entry_lines_client_id_index" on "quickbooks_journal_entry_lines" ("client_id");`,
    );

    this.addSql(
      `alter table "quickbooks_journal_entries" add constraint "quickbooks_journal_entries_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entries" add constraint "quickbooks_journal_entries_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "quickbooks_accounts" add constraint "quickbooks_accounts_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_accounts" add constraint "quickbooks_accounts_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_account_id_foreign" foreign key ("account_id") references "quickbooks_accounts" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_journal_entry_id_foreign" foreign key ("journal_entry_id") references "quickbooks_journal_entries" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_client_payment_id_foreign" foreign key ("client_payment_id") references "client_payments" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_broker_payment_id_foreign" foreign key ("broker_payment_id") references "broker_payments" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_batch_payment_id_foreign" foreign key ("batch_payment_id") references "client_batch_payments" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_reserve_id_foreign" foreign key ("reserve_id") references "reserves" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" add constraint "quickbooks_journal_entry_lines_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "client_factoring_configs" add column "quickbooks_id" text null, add column "quickbooks_name" text null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "quickbooks_journal_entry_lines" drop constraint "quickbooks_journal_entry_lines_journal_entry_id_foreign";`,
    );

    this.addSql(
      `alter table "quickbooks_journal_entry_lines" drop constraint "quickbooks_journal_entry_lines_account_id_foreign";`,
    );

    this.addSql(`drop table if exists "quickbooks_journal_entries" cascade;`);

    this.addSql(`drop table if exists "quickbooks_accounts" cascade;`);

    this.addSql(
      `drop table if exists "quickbooks_journal_entry_lines" cascade;`,
    );

    this.addSql(
      `alter table "client_factoring_configs" drop column "quickbooks_id", drop column "quickbooks_name";`,
    );
  }
}
