import { Migration } from '@mikro-orm/migrations';

export class Migration20250910091250 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "processing_notes" add column "status" text check ("status" in ('active', 'archived')) not null default 'active';`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "processing_notes" drop column "status";`);
  }
}
