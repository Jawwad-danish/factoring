import { Migration } from '@mikro-orm/migrations';

export class Migration20231110102742 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "reserves_client_payment" add constraint "reserves_client_payment_reserve_id_unique" unique ("reserve_id");',
    );

    this.addSql(
      'alter table "reserves_broker_payment" add constraint "reserves_broker_payment_reserve_id_unique" unique ("reserve_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "reserves_broker_payment" drop constraint "reserves_broker_payment_reserve_id_unique";',
    );

    this.addSql(
      'alter table "reserves_client_payment" drop constraint "reserves_client_payment_reserve_id_unique";',
    );
  }
}
