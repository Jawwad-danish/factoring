import { Migration } from '@mikro-orm/migrations';

export class Migration20250527092150 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table "worker_jobs" drop constraint if exists "worker_jobs_type_check";',
    );

    this.addSql(
      'alter table "worker_jobs" add constraint "worker_jobs_type_check" check ("type" in (\'REPORT\', \'CRON\'));',
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table "worker_jobs" drop constraint if exists "worker_jobs_type_check";',
    );

    this.addSql(
      'alter table "worker_jobs" add constraint "worker_jobs_type_check" check ("type" in (\'REPORT\'));',
    );
  }
}
