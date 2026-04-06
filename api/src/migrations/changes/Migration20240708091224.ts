import { Migration } from '@mikro-orm/migrations';

export class Migration20240708091224 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "client_factoring_analytics" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid not null, "first_purchased_date" timestamptz(3) null, constraint "client_factoring_analytics_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_factoring_analytics_created_at_index" on "client_factoring_analytics" ("created_at");',
    );
    this.addSql(
      'create index "client_factoring_analytics_client_id_index" on "client_factoring_analytics" ("client_id");',
    );
    this.addSql(
      'alter table "client_factoring_analytics" add constraint "client_factoring_analytics_client_id_unique" unique ("client_id");',
    );

    this.addSql(
      'alter table "client_factoring_analytics" add constraint "client_factoring_analytics_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_factoring_analytics" add constraint "client_factoring_analytics_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "client_factoring_analytics" cascade;');
  }
}
