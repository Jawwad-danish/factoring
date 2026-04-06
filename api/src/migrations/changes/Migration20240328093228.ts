import { Migration } from '@mikro-orm/migrations';

export class Migration20240328093228 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" add column "user_id" uuid not null;',
    );
    this.addSql(
      'alter table "client_factoring_configs" add constraint "client_factoring_configs_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'create index "client_factoring_configs_user_id_index" on "client_factoring_configs" ("user_id");',
    );
    this.addSql(
      'alter table "client_factoring_configs" add constraint "client_factoring_configs_user_id_unique" unique ("user_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_factoring_configs" drop constraint "client_factoring_configs_user_id_foreign";',
    );

    this.addSql('drop index "client_factoring_configs_user_id_index";');
    this.addSql(
      'alter table "client_factoring_configs" drop constraint "client_factoring_configs_user_id_unique";',
    );
    this.addSql(
      'alter table "client_factoring_configs" drop column "user_id";',
    );
  }
}
