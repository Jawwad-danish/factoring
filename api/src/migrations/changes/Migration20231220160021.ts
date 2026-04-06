import { Migration } from '@mikro-orm/migrations';

export class Migration20231220160021 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "request_storage" ("id" serial primary key, "created_at" timestamptz(3) not null, "route" varchar(255) not null, "method" text check ("method" in (\'GET\', \'POST\', \'PATCH\', \'PUT\', \'DELETE\')) not null, "payload" jsonb not null);',
    );
    this.addSql(
      'create index "request_storage_created_at_index" on "request_storage" ("created_at");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "request_storage" cascade;');
  }
}
