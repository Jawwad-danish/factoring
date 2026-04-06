import { Migration } from '@mikro-orm/migrations';

export class Migration20240311120359 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "reserves_client_payment" add column "amount" numeric not null default 0;',
    );
  }

  async down(): Promise<void> {
    this.addSql('alter table "reserves_client_payment" drop column "amount";');
  }
}
