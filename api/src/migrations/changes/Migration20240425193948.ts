import { Migration } from '@mikro-orm/migrations';

export class Migration20240425193948 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_payments" add column "bank_account_last_digits" text null;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_payments" drop column "bank_account_last_digits";',
    );
  }
}
