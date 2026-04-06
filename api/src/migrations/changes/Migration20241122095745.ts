import { Migration } from '@mikro-orm/migrations';
import { MaintenanceQueryGenerator } from '../utils';

export class Migration20241122095745 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new MaintenanceQueryGenerator(this.driver);
    this.addSql(
      'create table "maintenance" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "is_enabled" boolean not null, "message" varchar(255) null, constraint "maintenance_pkey" primary key ("id"));',
    );
    this.addSql(
      'comment on column "maintenance"."is_enabled" is \'Is maintenance mode enabled\';',
    );
    this.addSql(
      'comment on column "maintenance"."message" is \'Maintenance message\';',
    );
    this.addSql(
      'create index "maintenance_created_at_index" on "maintenance" ("created_at");',
    );

    this.addSql(
      'alter table "maintenance" add constraint "maintenance_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "maintenance" add constraint "maintenance_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(queryGenerator.addMaintenance({ isEnabled: false }));
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "maintenance" cascade;');
  }
}
