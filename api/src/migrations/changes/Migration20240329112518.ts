import { Migration } from '@mikro-orm/migrations';

export class Migration20240329112518 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" add column "accepted_fee_increase" boolean not null default false;',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."accepted_fee_increase" is \'Used to show the users acceptance of the client factoring fee increase\';',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" drop column "accepted_fee_increase";',
    );
  }
}
