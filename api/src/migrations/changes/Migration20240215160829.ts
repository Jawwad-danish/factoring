import { Migration } from '@mikro-orm/migrations';

export class Migration20240215160829 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "invoice_operations" drop constraint "invoice_operations_operation_id_foreign";',
    );

    this.addSql('drop table if exists "invoice_operations" cascade;');

    this.addSql('drop table if exists "operations" cascade;');
  }

  async down(): Promise<void> {
    this.addSql(
      'create table "invoice_operations" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "invoice_id" uuid not null default null, "operation_id" uuid not null default null, constraint "invoice_operations_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoice_operations_created_at_index" on "invoice_operations" ("created_at");',
    );
    this.addSql(
      'create index "invoice_operations_invoice_id_index" on "invoice_operations" ("invoice_id");',
    );
    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_invoice_id_unique" unique ("invoice_id");',
    );
    this.addSql(
      'create index "invoice_operations_operation_id_index" on "invoice_operations" ("operation_id");',
    );
    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_operation_id_unique" unique ("operation_id");',
    );

    this.addSql(
      'create table "operations" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "name" varchar not null default null, "type" text check ("type" in (\'info\', \'warning\', \'error\', \'other\')) not null default null, "status" text check ("status" in (\'active\', \'inactive\')) not null default null, "category" text check ("category" in (\'system\', \'user\')) not null default null, "visibility" text check ("visibility" in (\'client\', \'employee\', \'all\')) not null default null, constraint "operations_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "operations_created_at_index" on "operations" ("created_at");',
    );
    this.addSql(
      'create index "operations_name_index" on "operations" ("name");',
    );

    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_operation_id_foreign" foreign key ("operation_id") references "invoice_operations" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "operations" add constraint "operations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "operations" add constraint "operations_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade on delete no action;',
    );
  }
}
