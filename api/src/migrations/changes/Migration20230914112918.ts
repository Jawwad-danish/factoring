import { Migration } from '@mikro-orm/migrations';

export class Migration20230914112918 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "pending_buyouts_batch" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "factoring_company_id" uuid not null, "fee" numeric not null default 0, "agreed_fee" numeric not null default 0, constraint "pending_buyouts_batch_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "pending_buyouts_batch_created_at_index" on "pending_buyouts_batch" ("created_at");',
    );

    this.addSql(
      'create table "pending_buyouts" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "load_number" varchar(255) not null, "client_id" uuid not null, "batch_id" uuid not null, "broker_mc" varchar(255) null, "broker_name" varchar(255) null, "rate" numeric not null default 0, "payment_date" timestamptz(0) not null, constraint "pending_buyouts_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "pending_buyouts_created_at_index" on "pending_buyouts" ("created_at");',
    );
    this.addSql(
      'create index "pending_buyouts_load_number_index" on "pending_buyouts" ("load_number");',
    );
    this.addSql(
      'create index "pending_buyouts_client_id_index" on "pending_buyouts" ("client_id");',
    );
    this.addSql(
      'create index "pending_buyouts_batch_id_index" on "pending_buyouts" ("batch_id");',
    );

    this.addSql(
      'create table "reserves_buyout_batch" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "batch_id" uuid null, "reserve_id" uuid null, constraint "reserves_buyout_batch_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "reserves_buyout_batch_created_at_index" on "reserves_buyout_batch" ("created_at");',
    );
    this.addSql(
      'create index "reserves_buyout_batch_batch_id_index" on "reserves_buyout_batch" ("batch_id");',
    );

    this.addSql(
      'alter table "pending_buyouts_batch" add constraint "pending_buyouts_batch_factoring_company_id_foreign" foreign key ("factoring_company_id") references "factoring_companies" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "pending_buyouts" add constraint "pending_buyouts_batch_id_foreign" foreign key ("batch_id") references "pending_buyouts_batch" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves_buyout_batch" add constraint "reserves_buyout_batch_batch_id_foreign" foreign key ("batch_id") references "pending_buyouts_batch" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "reserves_buyout_batch" add constraint "reserves_buyout_batch_reserve_id_foreign" foreign key ("reserve_id") references "reserves" ("id") on update cascade on delete cascade;',
    );

    this.addSql('drop table if exists "buyout_invoices" cascade;');
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "pending_buyouts" drop constraint "pending_buyouts_batch_id_foreign";',
    );

    this.addSql(
      'alter table "reserves_buyout_batch" drop constraint "reserves_buyout_batch_batch_id_foreign";',
    );

    this.addSql(
      'create table "buyout_invoices" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "factoring_company_id" uuid not null default null, "fee" numeric not null default 0, constraint "buyout_invoices_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "buyout_invoices_created_at_index" on "buyout_invoices" ("created_at");',
    );

    this.addSql(
      'alter table "buyout_invoices" add constraint "buyout_invoices_factoring_company_id_foreign" foreign key ("factoring_company_id") references "factoring_companies" ("id") on update cascade on delete no action;',
    );

    this.addSql('drop table if exists "pending_buyouts_batch" cascade;');

    this.addSql('drop table if exists "pending_buyouts" cascade;');

    this.addSql('drop table if exists "reserves_buyout_batch" cascade;');

    this.addSql(
      'alter table "tag_definitions" alter column "used_by" type text[] using ("used_by"::text[]);',
    );
  }
}
