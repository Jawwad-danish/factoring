import { Migration } from '@mikro-orm/migrations';

export class Migration20260209090347 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "notifications" alter column "message" type text using ("message"::text);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "notifications" alter column "message" type varchar(255) using ("message"::varchar(255));',
    );
  }
}
