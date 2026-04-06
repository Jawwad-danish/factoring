import { Migration } from '@mikro-orm/migrations';

export class Migration20260226141118 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "worker_jobs" add column "correlation_id" uuid null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "worker_jobs" drop column "correlation_id";`);
  }
}
