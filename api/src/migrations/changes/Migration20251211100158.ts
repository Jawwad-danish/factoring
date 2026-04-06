import { Migration } from '@mikro-orm/migrations';

export class Migration20251211100158 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "payment_order" drop constraint if exists "payment_order_transfer_type_check";`,
    );

    this.addSql(
      `alter table "payment_order" add constraint "payment_order_transfer_type_check" check("transfer_type" in ('regular', 'expedite', 'wire', 'ach', 'same_day_ach', 'rtp'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "payment_order" drop constraint if exists "payment_order_transfer_type_check";`,
    );

    this.addSql(
      `alter table "payment_order" add constraint "payment_order_transfer_type_check" check("transfer_type" in ('regular', 'expedite', 'wire', 'ach', 'rtp'));`,
    );
  }
}
