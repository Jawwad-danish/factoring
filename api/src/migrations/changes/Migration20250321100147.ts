import { Migration } from '@mikro-orm/migrations';

export class Migration20250321100147 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "client_payment_plan_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) null, "payment_plan" varchar(255) null, "config_id" uuid not null, constraint "client_payment_plan_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_payment_plan_assoc_created_at_index" on "client_payment_plan_assoc" ("created_at");',
    );
    this.addSql(
      'create index "client_payment_plan_assoc_config_id_index" on "client_payment_plan_assoc" ("config_id");',
    );

    this.addSql(
      'alter table "client_payment_plan_assoc" add constraint "client_payment_plan_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_payment_plan_assoc" add constraint "client_payment_plan_assoc_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_factoring_configs" add column "payment_plan" varchar(255) null;',
    );
    this.addSql(
      'comment on column "client_factoring_configs"."payment_plan" is \'Payment plan for the client\';',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "client_payment_plan_assoc" cascade;');
    this.addSql(
      'alter table "client_factoring_configs" drop column "payment_plan";',
    );
  }
}
