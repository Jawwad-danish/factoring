import { Migration } from '@mikro-orm/migrations';

export class Migration20240131111622 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" add column "expedite_transfer_only" boolean not null default false, add column "done_submitting_invoices" boolean not null default false;',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."expedite_transfer_only" is \'Used for setting the trasfer type of incoming and not paid to the client invoices to expedite\';',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."done_submitting_invoices" is \'Used for letting the employees know if the client finished submitting invoices for the day\';',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" drop column "expedite_transfer_only";',
    );
    this.addSql(
      'alter table "client_factoring_configs" drop column "done_submitting_invoices";',
    );
  }
}
