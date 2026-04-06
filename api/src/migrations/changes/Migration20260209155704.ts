import { Migration } from '@mikro-orm/migrations';

export class Migration20260209155704 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "audit_log" drop column "note";`);

    this.addSql(`alter table "audit_log" add column "notes" text[] not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "audit_log" drop column "notes";`);

    this.addSql(`alter table "audit_log" add column "note" text not null;`);
  }
}
