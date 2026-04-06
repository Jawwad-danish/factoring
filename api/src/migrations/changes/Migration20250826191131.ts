import { Migration } from '@mikro-orm/migrations';

export class Migration20250826191131 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "client_factoring_configs_history" drop column "processing_notes";`,
    );

    this.addSql(
      `alter table "client_factoring_configs_history" add column "insurance_agency" varchar(255) null, add column "insurance_company" varchar(255) null, add column "insurance_monthly_payment_per_truck" numeric null, add column "insurance_renewal_date" timestamptz(3) null, add column "ofac_verified" boolean not null default false, add column "carrier411alerts" boolean not null default false, add column "tax_guard_alerts" boolean not null default false, add column "dryvan_trucks_amount" int not null default 0, add column "refrigerated_trucks_amount" int not null default 0, add column "flatbed_trucks_amount" int not null default 0, add column "stepdeck_trucks_amount" int not null default 0, add column "leased_trucks_amount" int not null default 0, add column "other_trucks_amount" int not null default 0;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "client_factoring_configs_history" drop column "insurance_agency", drop column "insurance_company", drop column "insurance_monthly_payment_per_truck", drop column "insurance_renewal_date", drop column "ofac_verified", drop column "carrier411alerts", drop column "tax_guard_alerts", drop column "dryvan_trucks_amount", drop column "refrigerated_trucks_amount", drop column "flatbed_trucks_amount", drop column "stepdeck_trucks_amount", drop column "leased_trucks_amount", drop column "other_trucks_amount";`,
    );

    this.addSql(
      `alter table "client_factoring_configs_history" add column "processing_notes" varchar(255) null default '';`,
    );
    this.addSql(
      `comment on column "client_factoring_configs_history"."processing_notes" is 'General client notes used for processing';`,
    );
  }
}
