import { Migration } from '@mikro-orm/migrations';

export class Migration20240507114624 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "broker_factoring_stats" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "broker_id" uuid not null, "average_days_to_pay" int not null, constraint "broker_factoring_stats_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_factoring_stats_created_at_index" on "broker_factoring_stats" ("created_at");',
    );
    this.addSql(
      'create index "broker_factoring_stats_broker_id_index" on "broker_factoring_stats" ("broker_id");',
    );

    this.addSql(
      'alter table "broker_factoring_stats" add constraint "broker_factoring_stats_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_factoring_stats" add constraint "broker_factoring_stats_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "broker_factoring_stats" cascade;');
  }
}
