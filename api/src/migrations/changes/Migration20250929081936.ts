import { Migration } from '@mikro-orm/migrations';

export class Migration20250929081936 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "broker_factoring_config" add column "verification_delay" boolean null, add column "preferences" varchar(255) null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "broker_factoring_config" drop column "verification_delay", drop column "preferences";`,
    );
  }
}
