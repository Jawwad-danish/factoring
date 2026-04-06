import { Migration } from '@mikro-orm/migrations';

export class Migration20240528101759 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "broker_factoring_stats" add column "invoices_under_review_total" int not null default -1, add column "not_received_total" int not null default -1, add column "shortpaid_total" int not null default -1, add column "non_payment_total" int not null default -1;',
    );
    this.addSql(
      'alter table "broker_factoring_stats" alter column "average_days_to_pay" type int using ("average_days_to_pay"::int);',
    );
    this.addSql(
      'alter table "broker_factoring_stats" alter column "average_days_to_pay" set default -1;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "broker_factoring_stats" alter column "average_days_to_pay" drop default;',
    );
    this.addSql(
      'alter table "broker_factoring_stats" alter column "average_days_to_pay" type int4 using ("average_days_to_pay"::int4);',
    );
    this.addSql(
      'alter table "broker_factoring_stats" drop column "invoices_under_review_total";',
    );
    this.addSql(
      'alter table "broker_factoring_stats" drop column "not_received_total";',
    );
    this.addSql(
      'alter table "broker_factoring_stats" drop column "shortpaid_total";',
    );
    this.addSql(
      'alter table "broker_factoring_stats" drop column "non_payment_total";',
    );
  }
}
