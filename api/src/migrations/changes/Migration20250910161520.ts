import { Migration } from '@mikro-orm/migrations';

export class Migration20250910161520 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "notifications" drop constraint if exists "notifications_medium_check";`,
    );

    this.addSql(
      `alter table "notifications" add constraint "notifications_medium_check" check("medium" in ('email', 'sms', 'push'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "notifications" drop constraint if exists "notifications_medium_check";`,
    );

    this.addSql(
      `alter table "notifications" add constraint "notifications_medium_check" check("medium" in ('email', 'sms'));`,
    );
  }
}
