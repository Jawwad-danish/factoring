import { Migration } from '@mikro-orm/migrations';

export class Migration20240306144706 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "reserves_client_payment" drop constraint "reserves_client_payment_reserve_id_unique";',
    );

    this.addSql(
      'alter table "invoice_client_payments" drop constraint "invoice_client_payments_invoice_id_unique";',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "invoice_client_payments" add constraint "invoice_client_payments_invoice_id_unique" unique ("invoice_id");',
    );

    this.addSql(
      'alter table "reserves_client_payment" add constraint "reserves_client_payment_reserve_id_unique" unique ("reserve_id");',
    );
  }
}
