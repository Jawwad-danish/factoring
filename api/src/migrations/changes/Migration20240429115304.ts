import { Migration } from '@mikro-orm/migrations';

export class Migration20240429115304 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_batch_payments" add column "expected_payment_date" timestamptz(3);',
    );
    this.addSql(
      `update "client_batch_payments" set "expected_payment_date" = CURRENT_TIMESTAMP;`,
    );

    this.addSql(`alter table "client_batch_payments"
    alter column "expected_payment_date" set not null;`);
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_batch_payments" drop column "expected_payment_date";',
    );
  }
}
