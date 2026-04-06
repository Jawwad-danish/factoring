import { Migration } from '@mikro-orm/migrations';

export class Migration20241209174502 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs_history" add column "requires_verification" boolean not null default false;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs_history" drop column "requires_verification";',
    );
  }
}
