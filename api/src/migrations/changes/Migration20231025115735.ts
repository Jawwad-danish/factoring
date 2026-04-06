import { Migration } from '@mikro-orm/migrations';

export class Migration20231025115735 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "broker_rating_history" drop constraint "broker_rating_history_reason_id_foreign";',
    );

    this.addSql(
      'alter table "broker_activity_log" drop constraint "broker_activity_log_broker_id_foreign";',
    );

    this.addSql(
      'alter table "broker_addresses" drop constraint "broker_addresses_broker_id_foreign";',
    );

    this.addSql(
      'alter table "broker_contacts" drop constraint "broker_contacts_broker_id_foreign";',
    );

    this.addSql(
      'alter table "broker_emails" drop constraint "broker_emails_broker_id_foreign";',
    );

    this.addSql(
      'alter table "broker_rating_history" drop constraint "broker_rating_history_broker_id_foreign";',
    );

    this.addSql(
      'alter table "broker_tag_assoc" drop constraint "broker_tag_assoc_broker_id_foreign";',
    );

    this.addSql('drop table if exists "broker_activity_log" cascade;');

    this.addSql('drop table if exists "broker_addresses" cascade;');

    this.addSql('drop table if exists "broker_contacts" cascade;');

    this.addSql('drop table if exists "broker_emails" cascade;');

    this.addSql('drop table if exists "broker_rating_history" cascade;');

    this.addSql('drop table if exists "broker_rating_reasons" cascade;');

    this.addSql('drop table if exists "broker_tag_assoc" cascade;');

    this.addSql('drop table if exists "brokers" cascade;');

    this.addSql(
      'alter table "tag_definitions" alter column "used_by" type text[] using ("used_by"::text[]);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'create table "broker_activity_log" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "tag_definition_id" uuid not null default null, "note" varchar not null default null, "old_payload" jsonb not null default null, "new_payload" jsonb not null default null, "broker_id" uuid not null default null, constraint "broker_activity_log_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_activity_log_broker_id_index" on "broker_activity_log" ("broker_id");',
    );
    this.addSql(
      'create index "broker_activity_log_created_at_index" on "broker_activity_log" ("created_at");',
    );
    this.addSql(
      'create index "broker_activity_log_tag_definition_id_index" on "broker_activity_log" ("tag_definition_id");',
    );

    this.addSql(
      'create table "broker_addresses" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "broker_id" uuid not null default null, "type" text check ("type" in (\'Office\', \'Mailing\')) not null default null, "country" varchar not null default null, "street_address" varchar not null default null, "address2" varchar null default null, "city" varchar not null default null, "state" varchar not null default null, "zip" varchar not null default null, constraint "broker_addresses_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_addresses_broker_id_index" on "broker_addresses" ("broker_id");',
    );
    this.addSql(
      'create index "broker_addresses_created_at_index" on "broker_addresses" ("created_at");',
    );

    this.addSql(
      'create table "broker_contacts" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "broker_id" uuid not null default null, "name" varchar not null default null, "country_phone_code" varchar not null default null, "phone" varchar not null default null, "phone_type" text check ("phone_type" in (\'mobile\', \'voip\', \'landline\', \'other\')) not null default null, "email" varchar not null default null, "type" text check ("type" in (\'business\', \'contact\')) not null default null, "role" text check ("role" in (\'Owner\', \'Broker\', \'Accounting\', \'Supervisor\', \'Other\')) not null default null, constraint "broker_contacts_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_contacts_broker_id_index" on "broker_contacts" ("broker_id");',
    );
    this.addSql(
      'create index "broker_contacts_created_at_index" on "broker_contacts" ("created_at");',
    );

    this.addSql(
      'create table "broker_emails" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "broker_id" uuid not null default null, "email" varchar not null default null, "type" text check ("type" in (\'NOA\', \'PaymentStatus\', \'InvoiceDelivery\')) not null default null, constraint "broker_emails_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_emails_broker_id_index" on "broker_emails" ("broker_id");',
    );
    this.addSql(
      'create index "broker_emails_created_at_index" on "broker_emails" ("created_at");',
    );
    this.addSql(
      'create index "broker_emails_email_index" on "broker_emails" ("email");',
    );

    this.addSql(
      "create table \"broker_rating_history\" (\"id\" uuid not null default uuid_generate_v4(), \"created_at\" timestamptz not null default null, \"created_by_id\" uuid not null default null, \"record_status\" text check (\"record_status\" in ('Active', 'Inactive')) not null default 'Active', \"broker_id\" uuid not null default null, \"reason_id\" uuid null default null, \"rating\" text check (\"rating\" in ('A', 'B', 'C', 'D', 'F', '--')) not null default null, \"external_rating\" text check (\"external_rating\" in ('A', 'B', 'C', 'D', 'F', '--')) not null default null, \"display_rating\" text check (\"display_rating\" in ('A', 'B', 'C', 'D', 'F', '--')) not null default null, \"note\" varchar null default null, constraint \"broker_rating_history_pkey\" primary key (\"id\"));",
    );
    this.addSql(
      'create index "broker_rating_history_broker_id_index" on "broker_rating_history" ("broker_id");',
    );
    this.addSql(
      'create index "broker_rating_history_created_at_index" on "broker_rating_history" ("created_at");',
    );
    this.addSql(
      'create index "broker_rating_history_reason_id_index" on "broker_rating_history" ("reason_id");',
    );

    this.addSql(
      'create table "broker_rating_reasons" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "reason" varchar not null default null, "status" text check ("status" in (\'Active\', \'Inactive\')) not null default null, constraint "broker_rating_reasons_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_rating_reasons_created_at_index" on "broker_rating_reasons" ("created_at");',
    );

    this.addSql(
      'create table "broker_tag_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "broker_id" uuid not null default null, "tag_definition_id" uuid not null default null, constraint "broker_tag_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_tag_assoc_broker_id_index" on "broker_tag_assoc" ("broker_id");',
    );
    this.addSql(
      'create index "broker_tag_assoc_created_at_index" on "broker_tag_assoc" ("created_at");',
    );
    this.addSql(
      'create index "broker_tag_assoc_tag_definition_id_index" on "broker_tag_assoc" ("tag_definition_id");',
    );

    this.addSql(
      'create table "brokers" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz not null default null, "created_by_id" uuid not null default null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz not null default null, "updated_by_id" uuid not null default null, "legal_name" varchar not null default null, "doing_business_as" varchar not null default null, "address" varchar null default null, "address2" varchar null default null, "city" varchar null default null, "state" varchar null default null, "zip" varchar null default null, "phone" varchar null default null, "mc" varchar null default null, "dot" varchar null default null, "portal_url" varchar null default null, "rating" text check ("rating" in (\'A\', \'B\', \'C\', \'D\', \'F\', \'--\')) not null default null, "external_rating" text check ("external_rating" in (\'A\', \'B\', \'C\', \'D\', \'F\', \'--\')) not null default null, "status" text check ("status" in (\'Active\', \'Inactive\', \'Sandbox\')) not null default null, "authority_status" text check ("authority_status" in (\'Active\', \'Inactive\')) not null default null, constraint "brokers_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "brokers_created_at_index" on "brokers" ("created_at");',
    );
    this.addSql(
      'create index "brokers_legal_name_index" on "brokers" ("legal_name");',
    );

    this.addSql(
      'alter table "broker_activity_log" add constraint "broker_activity_log_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "broker_activity_log" add constraint "broker_activity_log_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "broker_addresses" add constraint "broker_addresses_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "broker_contacts" add constraint "broker_contacts_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "broker_emails" add constraint "broker_emails_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "broker_rating_history" add constraint "broker_rating_history_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "broker_rating_history" add constraint "broker_rating_history_reason_id_foreign" foreign key ("reason_id") references "broker_rating_reasons" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "broker_tag_assoc" add constraint "broker_tag_assoc_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade on delete no action;',
    );
    this.addSql(
      'alter table "broker_tag_assoc" add constraint "broker_tag_assoc_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade on delete no action;',
    );

    this.addSql(
      'alter table "tag_definitions" alter column "used_by" type text[] using ("used_by"::text[]);',
    );
  }
}
