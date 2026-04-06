import { Migration } from '@mikro-orm/migrations';

export class Migration20231109084122 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "database_audit_log" add column "entity_id" uuid null;',
    );
    this.addSql(
      'create index "database_audit_log_entity_id_index" on "database_audit_log" ("entity_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop index "database_audit_log_entity_id_index";');
    this.addSql('alter table "database_audit_log" drop column "entity_id";');
  }
}
