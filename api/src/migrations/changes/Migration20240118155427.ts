import { Migration } from '@mikro-orm/migrations';

export class Migration20240118155427 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "broker_payments" alter column "batch_date" type timestamptz(0) using ("batch_date"::timestamptz(0));',
    );
    this.addSql(
      'alter table "broker_payments" alter column "batch_date" set not null;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "broker_payments" alter column "batch_date" type timestamptz using ("batch_date"::timestamptz);',
    );
    this.addSql(
      'alter table "broker_payments" alter column "batch_date" drop not null;',
    );
  }
}
