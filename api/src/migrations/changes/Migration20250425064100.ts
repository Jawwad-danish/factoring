import { Migration } from '@mikro-orm/migrations';

export class Migration20250425064100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "peruse_jobs" drop constraint if exists "peruse_jobs_type_check";`,
    );
    this.addSql(
      `alter table "peruse_jobs" drop constraint if exists "peruse_jobs_status_check";`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "peruse_jobs" drop constraint if exists "peruse_jobs_type_check";`,
    );
    this.addSql(
      `alter table "peruse_jobs" drop constraint if exists "peruse_jobs_status_check";`,
    );
  }
}
