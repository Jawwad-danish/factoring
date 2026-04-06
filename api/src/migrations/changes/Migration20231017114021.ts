import { Migration } from '@mikro-orm/migrations';

export class Migration20231017114021 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "pending_buyouts_batch" add column "client_payable_fee" numeric not null default 0, add column "bobtail_payable_fee" numeric not null default 0;',
    );
    this.addSql('alter table "pending_buyouts_batch" drop column "fee";');
    this.addSql(
      'alter table "pending_buyouts_batch" drop column "agreed_fee";',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "pending_buyouts_batch" add column "fee" numeric not null default 0, add column "agreed_fee" numeric not null default 0;',
    );
    this.addSql(
      'alter table "pending_buyouts_batch" drop column "client_payable_fee";',
    );
    this.addSql(
      'alter table "pending_buyouts_batch" drop column "bobtail_payable_fee";',
    );
  }
}
