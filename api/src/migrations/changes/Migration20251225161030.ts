import { Migration } from '@mikro-orm/migrations';

export class Migration20251225161030 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "client_payments" alter column "client_bank_account_id" drop default;`,
    );
    this.addSql(
      `alter table "client_payments" alter column "client_bank_account_id" type uuid using ("client_bank_account_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "client_payments" alter column "client_bank_account_id" drop not null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "client_payments" alter column "client_bank_account_id" set default null;`,
    );
    this.addSql(
      `alter table "client_payments" alter column "client_bank_account_id" type uuid using ("client_bank_account_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "client_payments" alter column "client_bank_account_id" set not null;`,
    );
  }
}
