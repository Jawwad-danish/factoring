import { Migration } from '@mikro-orm/migrations';

export class Migration20250701222526 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "client_factoring_configs" add column "lead_attribution" text check ("lead_attribution" in ('referral', 'web', 'email', 'cold_calling', 'existing_customer')) null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "client_factoring_configs" drop column "lead_attribution";`,
    );
  }
}
