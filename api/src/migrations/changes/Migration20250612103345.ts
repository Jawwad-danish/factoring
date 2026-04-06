import { Migration } from '@mikro-orm/migrations';

export class Migration20250612103345 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "client_factoring_underwriting_notes" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in ('Active', 'Inactive')) not null default 'Active', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "config_id" uuid not null, "notes" text not null, "subject" text check ("subject" in ('corporation_documents', 'ucc', 'license', '8821', 'other')) not null default 'other', constraint "client_factoring_underwriting_notes_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "client_factoring_underwriting_notes_created_at_index" on "client_factoring_underwriting_notes" ("created_at");`,
    );
    this.addSql(
      `create index "client_factoring_underwriting_notes_config_id_index" on "client_factoring_underwriting_notes" ("config_id");`,
    );

    this.addSql(
      `alter table "client_factoring_underwriting_notes" add constraint "client_factoring_underwriting_notes_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "client_factoring_underwriting_notes" add constraint "client_factoring_underwriting_notes_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "client_factoring_underwriting_notes" add constraint "client_factoring_underwriting_notes_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "client_factoring_configs" add column "sales_rep_id" uuid null, add column "insurance_agency" varchar(255) null, add column "insurance_company" varchar(255) null, add column "insurance_monthly_payment_per_truck" numeric null, add column "insurance_renewal_date" timestamptz(3) null, add column "ofac_verified" boolean not null default false, add column "carrier411alerts" boolean not null default false, add column "tax_guard_alerts" boolean not null default false, add column "dryvan_trucks_amount" int not null default 0, add column "refrigerated_trucks_amount" int not null default 0, add column "flatbed_trucks_amount" int not null default 0, add column "stepdeck_trucks_amount" int not null default 0, add column "leased_trucks_amount" int not null default 0, add column "other_trucks_amount" int not null default 0;`,
    );
    this.addSql(
      `alter table "client_factoring_configs" add constraint "client_factoring_configs_sales_rep_id_foreign" foreign key ("sales_rep_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "client_factoring_configs_sales_rep_id_index" on "client_factoring_configs" ("sales_rep_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop table if exists "client_factoring_underwriting_notes" cascade;`,
    );

    this.addSql(
      `alter table "client_factoring_configs" drop constraint "client_factoring_configs_sales_rep_id_foreign";`,
    );

    this.addSql(`drop index "client_factoring_configs_sales_rep_id_index";`);
    this.addSql(
      `alter table "client_factoring_configs" drop column "sales_rep_id", drop column "insurance_agency", drop column "insurance_company", drop column "insurance_monthly_payment_per_truck", drop column "insurance_renewal_date", drop column "ofac_verified", drop column "carrier411alerts", drop column "tax_guard_alerts", drop column "dryvan_trucks_amount", drop column "refrigerated_trucks_amount", drop column "flatbed_trucks_amount", drop column "stepdeck_trucks_amount", drop column "leased_trucks_amount", drop column "other_trucks_amount";`,
    );
  }
}
