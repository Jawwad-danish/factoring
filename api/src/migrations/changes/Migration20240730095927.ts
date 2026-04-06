import { Migration } from '@mikro-orm/migrations';

export class Migration20240730095927 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_analytics" add column "first_created_date" timestamptz(3) null;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_analytics" drop column "first_created_date";',
    );
  }
}
