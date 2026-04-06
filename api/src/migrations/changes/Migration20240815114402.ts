import { Migration } from '@mikro-orm/migrations';

export class Migration20240815114402 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" add column "cc_in_emails" boolean not null default false;',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."cc_in_emails" is \'Used for including clients email in cc for NOA emails and invoice delivery emails\';',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" drop column "cc_in_emails";',
    );
  }
}
