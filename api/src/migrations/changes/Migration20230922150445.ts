import { Migration } from '@mikro-orm/migrations';

export class Migration20230922150445 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "factoring_companies" add constraint "factoring_companies_name_unique" unique ("name");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "factoring_companies" drop constraint "factoring_companies_name_unique";',
    );
  }
}
