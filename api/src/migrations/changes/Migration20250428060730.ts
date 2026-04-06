import { Migration } from '@mikro-orm/migrations';

export class Migration20250428060730 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "broker_payments" alter column "batch_date" type timestamptz using ("batch_date"::timestamptz);`,
    );

    this.addSql(
      `alter table "broker_factoring_stats" drop column "invoices_under_review_total", drop column "not_received_total", drop column "shortpaid_total", drop column "non_payment_total";`,
    );

    this.addSql(
      `alter table "broker_factoring_stats" add column "total_clients_working_with" int not null default -1, add column "total_invoices_under_review" int not null default -1, add column "total_invoices_not_received" int not null default -1, add column "total_invoices_shortpaid" int not null default -1, add column "total_invoices_non_payment" int not null default -1, add column "total_aging" int not null default -1, add column "last_payment_date" timestamptz(3) null, add column "dilution_last30days" numeric not null default -1, add column "dilution_last60days" numeric not null default -1, add column "dilution_last90days" numeric not null default -1, add column "days_to_pay_last30days" numeric not null default -1, add column "days_to_pay_last60days" numeric not null default -1, add column "days_to_pay_last90days" numeric not null default -1;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "broker_factoring_stats" drop column "total_clients_working_with", drop column "total_invoices_under_review", drop column "total_invoices_not_received", drop column "total_invoices_shortpaid", drop column "total_invoices_non_payment", drop column "total_aging", drop column "last_payment_date", drop column "dilution_last30days", drop column "dilution_last60days", drop column "dilution_last90days", drop column "days_to_pay_last30days", drop column "days_to_pay_last60days", drop column "days_to_pay_last90days";`,
    );

    this.addSql(
      `alter table "broker_factoring_stats" add column "invoices_under_review_total" int4 not null default -1, add column "not_received_total" int4 not null default -1, add column "shortpaid_total" int4 not null default -1, add column "non_payment_total" int4 not null default -1;`,
    );
  }
}
