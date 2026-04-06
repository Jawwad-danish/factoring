import { Migration } from '@mikro-orm/migrations';

const extensions = ['uuid-ossp', 'pg_trgm'];

export class Migration20230824155323 extends Migration {
  async up(): Promise<void> {
    for (const extension of extensions) {
      this.addSql(`CREATE EXTENSION IF NOT EXISTS "${extension}"`);
    }
    this.addSql(
      'create table "brokers" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "legal_name" varchar(255) not null, "doing_business_as" varchar(255) not null, "address" varchar(255) null, "address2" varchar(255) null, "city" varchar(255) null, "state" varchar(255) null, "zip" varchar(255) null, "phone" varchar(255) null, "mc" varchar(255) null, "dot" varchar(255) null, "portal_url" varchar(255) null, "rating" text check ("rating" in (\'A\', \'B\', \'C\', \'D\', \'F\', \'--\')) not null, "external_rating" text check ("external_rating" in (\'A\', \'B\', \'C\', \'D\', \'F\', \'--\')) not null, "status" text check ("status" in (\'Active\', \'Inactive\', \'Sandbox\')) not null, "authority_status" text check ("authority_status" in (\'Active\', \'Inactive\')) not null, constraint "brokers_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "brokers_created_at_index" on "brokers" ("created_at");',
    );
    this.addSql(
      'create index "brokers_legal_name_index" on "brokers" ("legal_name");',
    );

    this.addSql(
      'create table "broker_emails" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "broker_id" uuid not null, "email" varchar(255) not null, "type" text check ("type" in (\'NOA\', \'PaymentStatus\', \'InvoiceDelivery\')) not null, constraint "broker_emails_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_emails_created_at_index" on "broker_emails" ("created_at");',
    );
    this.addSql(
      'create index "broker_emails_broker_id_index" on "broker_emails" ("broker_id");',
    );
    this.addSql(
      'create index "broker_emails_email_index" on "broker_emails" ("email");',
    );

    this.addSql(
      'create table "broker_contacts" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "broker_id" uuid not null, "name" varchar(255) not null, "country_phone_code" varchar(255) not null, "phone" varchar(255) not null, "phone_type" text check ("phone_type" in (\'mobile\', \'voip\', \'landline\', \'other\')) not null, "email" varchar(255) not null, "type" text check ("type" in (\'business\', \'contact\')) not null, "role" text check ("role" in (\'Owner\', \'Broker\', \'Accounting\', \'Supervisor\', \'Other\')) not null, constraint "broker_contacts_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_contacts_created_at_index" on "broker_contacts" ("created_at");',
    );
    this.addSql(
      'create index "broker_contacts_broker_id_index" on "broker_contacts" ("broker_id");',
    );

    this.addSql(
      'create table "broker_addresses" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "broker_id" uuid not null, "type" text check ("type" in (\'Office\', \'Mailing\')) not null, "country" varchar(255) not null, "street_address" varchar(255) not null, "address2" varchar(255) null, "city" varchar(255) not null, "state" varchar(255) not null, "zip" varchar(255) not null, constraint "broker_addresses_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_addresses_created_at_index" on "broker_addresses" ("created_at");',
    );
    this.addSql(
      'create index "broker_addresses_broker_id_index" on "broker_addresses" ("broker_id");',
    );

    this.addSql(
      'create table "broker_payment_reasons" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "reason" varchar(255) not null, "type" text check ("type" in (\'shortpaid\', \'nonpayment\', \'overpaid\')) not null, constraint "broker_payment_reasons_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_payment_reasons_created_at_index" on "broker_payment_reasons" ("created_at");',
    );

    this.addSql(
      'create table "broker_rating_reasons" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "reason" varchar(255) not null, "status" text check ("status" in (\'Active\', \'Inactive\')) not null, constraint "broker_rating_reasons_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_rating_reasons_created_at_index" on "broker_rating_reasons" ("created_at");',
    );

    this.addSql(
      "create table \"broker_rating_history\" (\"id\" uuid not null default uuid_generate_v4(), \"created_at\" timestamptz(3) not null, \"created_by_id\" uuid not null, \"record_status\" text check (\"record_status\" in ('Active', 'Inactive')) not null default 'Active', \"broker_id\" uuid not null, \"reason_id\" uuid null, \"rating\" text check (\"rating\" in ('A', 'B', 'C', 'D', 'F', '--')) not null, \"external_rating\" text check (\"external_rating\" in ('A', 'B', 'C', 'D', 'F', '--')) not null, \"display_rating\" text check (\"display_rating\" in ('A', 'B', 'C', 'D', 'F', '--')) not null, \"note\" varchar(255) null, constraint \"broker_rating_history_pkey\" primary key (\"id\"));",
    );
    this.addSql(
      'create index "broker_rating_history_created_at_index" on "broker_rating_history" ("created_at");',
    );
    this.addSql(
      'create index "broker_rating_history_broker_id_index" on "broker_rating_history" ("broker_id");',
    );
    this.addSql(
      'create index "broker_rating_history_reason_id_index" on "broker_rating_history" ("reason_id");',
    );

    this.addSql(
      'create table "client_batch_payments" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, "type" text check ("type" in (\'ach\', \'wire\', \'ach-debit\')) not null, "status" text check ("status" in (\'done\', \'pending\', \'in_progress\', \'failed\', \'not_sent\')) not null, constraint "client_batch_payments_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_batch_payments_created_at_index" on "client_batch_payments" ("created_at");',
    );
    this.addSql(
      'create index "client_batch_payments_name_index" on "client_batch_payments" ("name");',
    );
    this.addSql(
      'alter table "client_batch_payments" add constraint "client_batch_payments_name_unique" unique ("name");',
    );

    this.addSql(
      'create table "client_broker_assignments" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid not null, "broker_id" uuid not null, "status" text check ("status" in (\'sent\', \'verified\', \'released\')) not null, constraint "client_broker_assignments_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_broker_assignments_created_at_index" on "client_broker_assignments" ("created_at");',
    );

    this.addSql(
      'create table "client_factoring_configs" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid not null, "factoring_rate_percentage" numeric not null, "verification_percentage" numeric not null default 1, "vip" boolean not null default false, "status" text check ("status" in (\'active\', \'on boarding\', \'hold\', \'released\')) not null default \'on boarding\', constraint "client_factoring_configs_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_factoring_configs_created_at_index" on "client_factoring_configs" ("created_at");',
    );
    this.addSql(
      'create index "client_factoring_configs_client_id_index" on "client_factoring_configs" ("client_id");',
    );
    this.addSql(
      'alter table "client_factoring_configs" add constraint "client_factoring_configs_client_id_unique" unique ("client_id");',
    );

    this.addSql(
      'create table "client_payments" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid not null, "batch_payment_id" uuid not null, "type" text check ("type" in (\'invoice\', \'reserve\', \'other\')) not null, "amount" numeric not null default 0, "operation_type" text check ("operation_type" in (\'credit\', \'debit\')) not null, "transfer_type" text check ("transfer_type" in (\'ach\', \'wire\', \'ach-debit\')) not null, "status" text check ("status" in (\'pending\', \'done\', \'failed\')) not null default \'pending\', "transfer_fee" numeric not null default 0, "client_bank_account_id" uuid not null, constraint "client_payments_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_payments_created_at_index" on "client_payments" ("created_at");',
    );
    this.addSql(
      'create index "client_payments_client_id_index" on "client_payments" ("client_id");',
    );
    this.addSql(
      'create index "client_payments_batch_payment_id_index" on "client_payments" ("batch_payment_id");',
    );
    this.addSql(
      'create index "client_payments_client_bank_account_id_index" on "client_payments" ("client_bank_account_id");',
    );

    this.addSql(
      "create table \"client_status_reason_configs\" (\"id\" uuid not null default uuid_generate_v4(), \"created_at\" timestamptz(3) not null, \"created_by_id\" uuid not null, \"record_status\" text check (\"record_status\" in ('Active', 'Inactive')) not null default 'Active', \"updated_at\" timestamptz(3) not null, \"updated_by_id\" uuid not null, \"status\" text check (\"status\" in ('active', 'on boarding', 'hold', 'released')) not null default 'hold', \"reason\" text check (\"reason\" in ('fraud', 'fmcsa_issues', 'buyout_in_progress', 'other', 'competitor', 'insurance_issues', 'not_submitting_invoices', 'out_of_business', 'possible_double_factor', 'requesting_a_loan', 'stopped_factoring')) not null default 'other', \"notify_client\" boolean not null default false, \"display_message\" boolean not null default false, constraint \"client_status_reason_configs_pkey\" primary key (\"id\"));",
    );
    this.addSql(
      'create index "client_status_reason_configs_created_at_index" on "client_status_reason_configs" ("created_at");',
    );

    this.addSql(
      'create table "client_status_reasons_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) not null, "client_id" uuid not null, "client_status_reason_config_id" uuid not null, constraint "client_status_reasons_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_status_reasons_assoc_created_at_index" on "client_status_reasons_assoc" ("created_at");',
    );

    this.addSql(
      'create table "database_audit_log" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "table" varchar(255) not null, "operation" text check ("operation" in (\'CREATE\', \'UPDATE\', \'DELETE\', \'SOFT_DELETE\', \'REACTIVATE\')) not null, "serialized_row" jsonb not null, constraint "database_audit_log_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "database_audit_log_created_at_index" on "database_audit_log" ("created_at");',
    );

    this.addSql(
      'create table "factoring_client_bank_accounts" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_bank_account_id" uuid not null, "primary" boolean not null default false, constraint "factoring_client_bank_accounts_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "factoring_client_bank_accounts_created_at_index" on "factoring_client_bank_accounts" ("created_at");',
    );
    this.addSql(
      'create index "factoring_client_bank_accounts_client_bank_account_id_index" on "factoring_client_bank_accounts" ("client_bank_account_id");',
    );

    this.addSql(
      'create table "factoring_companies" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, constraint "factoring_companies_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "factoring_companies_created_at_index" on "factoring_companies" ("created_at");',
    );

    this.addSql(
      'create table "buyout_invoices" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "factoring_company_id" uuid not null, "fee" numeric not null default 0, constraint "buyout_invoices_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "buyout_invoices_created_at_index" on "buyout_invoices" ("created_at");',
    );

    this.addSql(
      'create table "invoices" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_id" uuid not null, "broker_id" uuid null, "display_id" varchar(255) not null, "buyout_id" uuid null, "load_number" varchar(255) not null, "line_haul_rate" numeric not null default 0, "lumper" numeric not null, "detention" numeric not null, "advance" numeric not null, "payment_date" timestamptz(0) null, "expedited" boolean not null, "accounts_receivable_value" numeric not null default 0, "value" numeric not null, "approved_factor_fee_percentage" numeric not null default 0, "approved_factor_fee" numeric not null default 0, "deduction" numeric not null default 0, "memo" varchar(255) null, "note" varchar(255) null, "status" text check ("status" in (\'purchased\', \'under_review\', \'rejected\')) not null, "rejected_date" timestamptz(0) null, "purchased_date" timestamptz(0) null, "broker_payment_status" text check ("broker_payment_status" in (\'shortpaid\', \'overpaid\', \'nonpayment\', \'in_full\', \'not_received\', \'non_factored_payment\')) not null default \'not_received\', "client_payment_status" text check ("client_payment_status" in (\'pending\', \'not_applicable\', \'in_progress\', \'sent\', \'failed\', \'completed\')) not null default \'not_applicable\', "verification_status" text check ("verification_status" in (\'required\', \'not_required\', \'verified\', \'bypassed\', \'in_progress\', \'failed\')) not null default \'required\', constraint "invoices_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoices_created_at_index" on "invoices" ("created_at");',
    );
    this.addSql(
      'create index "invoices_client_id_index" on "invoices" ("client_id");',
    );
    this.addSql(
      'create index "invoices_broker_id_index" on "invoices" ("broker_id");',
    );
    this.addSql(
      'create index "invoices_display_id_index" on "invoices" ("display_id");',
    );
    this.addSql(
      'create index "invoices_buyout_id_index" on "invoices" ("buyout_id");',
    );
    this.addSql(
      'create index "invoices_load_number_index" on "invoices" ("load_number");',
    );
    this.addSql(
      'create index "invoices_status_index" on "invoices" ("status");',
    );
    this.addSql(
      'create index "invoices_broker_payment_status_index" on "invoices" ("broker_payment_status");',
    );
    this.addSql(
      'create index "invoices_client_payment_status_index" on "invoices" ("client_payment_status");',
    );
    this.addSql(
      'create index "invoices_verification_status_index" on "invoices" ("verification_status");',
    );

    this.addSql(
      'create table "documents" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, "type" text check ("type" in (\'generated\', \'uploaded\')) not null default \'generated\', "label" text check ("label" in (\'rate_of_confirmation\', \'bill_of_landing\', \'lumper_receipt\', \'scale_ticket\', \'other\')) not null default \'other\', "internal_url" varchar(255) not null, "external_url" varchar(255) null, "file_hash" varchar(255) null, "invoice_id" uuid not null, constraint "documents_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "documents_created_at_index" on "documents" ("created_at");',
    );
    this.addSql('create index "documents_name_index" on "documents" ("name");');
    this.addSql(
      'create index "documents_invoice_id_index" on "documents" ("invoice_id");',
    );

    this.addSql(
      'create table "invoice_client_payments" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "invoice_id" uuid not null, "client_payment_id" uuid not null, "amount" numeric not null default 0, constraint "invoice_client_payments_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoice_client_payments_created_at_index" on "invoice_client_payments" ("created_at");',
    );
    this.addSql(
      'create index "invoice_client_payments_invoice_id_index" on "invoice_client_payments" ("invoice_id");',
    );
    this.addSql(
      'alter table "invoice_client_payments" add constraint "invoice_client_payments_invoice_id_unique" unique ("invoice_id");',
    );
    this.addSql(
      'create index "invoice_client_payments_client_payment_id_index" on "invoice_client_payments" ("client_payment_id");',
    );

    this.addSql(
      'create table "broker_payments" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "invoice_id" uuid not null, "type" text check ("type" in (\'ACH\', \'Check\')) null, "amount" numeric not null default 0, "check_number" varchar(255) null, "batch_date" timestamptz(0) null, constraint "broker_payments_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_payments_created_at_index" on "broker_payments" ("created_at");',
    );
    this.addSql(
      'create index "broker_payments_invoice_id_index" on "broker_payments" ("invoice_id");',
    );

    this.addSql(
      'create table "broker_payment_reasons_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "note" varchar(255) not null, "broker_payment_id" uuid not null, "broker_payment_reason_id" uuid not null, constraint "broker_payment_reasons_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_payment_reasons_assoc_created_at_index" on "broker_payment_reasons_assoc" ("created_at");',
    );

    this.addSql(
      'create table "invoice_operations" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "invoice_id" uuid not null, "operation_id" uuid not null, constraint "invoice_operations_pkey" primary key ("id"));',
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
      'create table "invoice_processor_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, "invoice_id" uuid not null, "processor_id" uuid not null, constraint "invoice_processor_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoice_processor_assoc_created_at_index" on "invoice_processor_assoc" ("created_at");',
    );
    this.addSql(
      'create index "invoice_processor_assoc_invoice_id_index" on "invoice_processor_assoc" ("invoice_id");',
    );

    this.addSql(
      'create table "operations" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, "type" text check ("type" in (\'info\', \'warning\', \'error\', \'other\')) not null, "status" text check ("status" in (\'active\', \'inactive\')) not null, "category" text check ("category" in (\'system\', \'user\')) not null, "visibility" text check ("visibility" in (\'client\', \'employee\', \'all\')) not null, constraint "operations_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "operations_created_at_index" on "operations" ("created_at");',
    );
    this.addSql(
      'create index "operations_name_index" on "operations" ("name");',
    );

    this.addSql(
      "create table \"reserves\" (\"id\" uuid not null default uuid_generate_v4(), \"created_at\" timestamptz(3) not null, \"created_by_id\" uuid not null, \"record_status\" text check (\"record_status\" in ('Active', 'Inactive')) not null default 'Active', \"client_id\" uuid not null, \"amount\" numeric not null default 0, \"reason\" text check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment')) not null, \"payload\" jsonb null, \"note\" varchar(1024) not null, constraint \"reserves_pkey\" primary key (\"id\"));",
    );
    this.addSql(
      'create index "reserves_created_at_index" on "reserves" ("created_at");',
    );
    this.addSql(
      'create index "reserves_client_id_index" on "reserves" ("client_id");',
    );

    this.addSql(
      'create table "reserves_client_payment" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "client_payment_id" uuid not null, "reserve_id" uuid not null, constraint "reserves_client_payment_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "reserves_client_payment_created_at_index" on "reserves_client_payment" ("created_at");',
    );
    this.addSql(
      'create index "reserves_client_payment_client_payment_id_index" on "reserves_client_payment" ("client_payment_id");',
    );

    this.addSql(
      'create table "reserves_broker_payment" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "broker_payment_id" uuid null, "reserve_id" uuid null, constraint "reserves_broker_payment_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "reserves_broker_payment_created_at_index" on "reserves_broker_payment" ("created_at");',
    );
    this.addSql(
      'create index "reserves_broker_payment_broker_payment_id_index" on "reserves_broker_payment" ("broker_payment_id");',
    );

    this.addSql(
      'create table "tag_definitions" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, "key" varchar(255) not null, "note" varchar(255) not null, "note_placeholders" text[] null, "level" text check ("level" in (\'info\', \'warning\', \'error\', \'other\')) not null, "used_by" text[] not null, "visibility" text check ("visibility" in (\'client\', \'employee\', \'all\')) not null, constraint "tag_definitions_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "tag_definitions_created_at_index" on "tag_definitions" ("created_at");',
    );
    this.addSql(
      'create index "tag_definitions_name_index" on "tag_definitions" ("name");',
    );
    this.addSql(
      'create index "tag_definitions_key_index" on "tag_definitions" ("key");',
    );
    this.addSql(
      'alter table "tag_definitions" add constraint "tag_definitions_key_unique" unique ("key");',
    );

    this.addSql(
      'create table "invoice_tag_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "invoice_id" uuid not null, "tag_definition_id" uuid not null, "assigned_by_type" text check ("assigned_by_type" in (\'user\', \'system\')) not null, constraint "invoice_tag_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoice_tag_assoc_created_at_index" on "invoice_tag_assoc" ("created_at");',
    );
    this.addSql(
      'create index "invoice_tag_assoc_invoice_id_index" on "invoice_tag_assoc" ("invoice_id");',
    );
    this.addSql(
      'create index "invoice_tag_assoc_tag_definition_id_index" on "invoice_tag_assoc" ("tag_definition_id");',
    );

    this.addSql(
      'create table "invoice_tag_definitions" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "tag_definition_id" uuid not null, "category" text check ("category" in (\'system\', \'user\')) not null, "payload_format" varchar(255) not null, "visibility" text check ("visibility" in (\'client\', \'employee\', \'all\')) not null, constraint "invoice_tag_definitions_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoice_tag_definitions_created_at_index" on "invoice_tag_definitions" ("created_at");',
    );
    this.addSql(
      'create index "invoice_tag_definitions_tag_definition_id_index" on "invoice_tag_definitions" ("tag_definition_id");',
    );

    this.addSql(
      'create table "factoring_client_bank_accounts_tag_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "tag_definition_id" uuid not null, "factoring_client_bank_account_id" uuid not null, "payload_format" varchar(255) not null, constraint "factoring_client_bank_accounts_tag_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "factoring_client_bank_accounts_tag_assoc_created_at_index" on "factoring_client_bank_accounts_tag_assoc" ("created_at");',
    );
    this.addSql(
      'create index "factoring_client_bank_accounts_tag_assoc_factoring__16102_index" on "factoring_client_bank_accounts_tag_assoc" ("factoring_client_bank_account_id");',
    );

    this.addSql(
      'create table "client_tag_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "client_id" uuid not null, "tag_definition_id" uuid not null, constraint "client_tag_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "client_tag_assoc_created_at_index" on "client_tag_assoc" ("created_at");',
    );
    this.addSql(
      'create index "client_tag_assoc_client_id_index" on "client_tag_assoc" ("client_id");',
    );
    this.addSql(
      'create index "client_tag_assoc_tag_definition_id_index" on "client_tag_assoc" ("tag_definition_id");',
    );

    this.addSql(
      'create table "broker_tag_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "broker_id" uuid not null, "tag_definition_id" uuid not null, constraint "broker_tag_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_tag_assoc_created_at_index" on "broker_tag_assoc" ("created_at");',
    );
    this.addSql(
      'create index "broker_tag_assoc_broker_id_index" on "broker_tag_assoc" ("broker_id");',
    );
    this.addSql(
      'create index "broker_tag_assoc_tag_definition_id_index" on "broker_tag_assoc" ("tag_definition_id");',
    );

    this.addSql(
      'create table "broker_activity_log" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "tag_definition_id" uuid not null, "note" varchar(255) not null, "old_payload" jsonb not null, "new_payload" jsonb not null, "broker_id" uuid not null, constraint "broker_activity_log_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "broker_activity_log_created_at_index" on "broker_activity_log" ("created_at");',
    );
    this.addSql(
      'create index "broker_activity_log_tag_definition_id_index" on "broker_activity_log" ("tag_definition_id");',
    );
    this.addSql(
      'create index "broker_activity_log_broker_id_index" on "broker_activity_log" ("broker_id");',
    );

    this.addSql(
      'create table "invoice_activity_log" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "tag_definition_id" uuid not null, "tag_status" text check ("tag_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "group_id" uuid not null default uuid_generate_v4(), "note" varchar(1024) not null, "payload" jsonb not null, "invoice_id" uuid not null, constraint "invoice_activity_log_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "invoice_activity_log_created_at_index" on "invoice_activity_log" ("created_at");',
    );
    this.addSql(
      'create index "invoice_activity_log_tag_definition_id_index" on "invoice_activity_log" ("tag_definition_id");',
    );
    this.addSql(
      'create index "invoice_activity_log_invoice_id_index" on "invoice_activity_log" ("invoice_id");',
    );

    this.addSql(
      'create table "tag_definition_group" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "name" varchar(255) not null, "key" varchar(255) not null, constraint "tag_definition_group_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "tag_definition_group_created_at_index" on "tag_definition_group" ("created_at");',
    );
    this.addSql(
      'create index "tag_definition_group_key_index" on "tag_definition_group" ("key");',
    );
    this.addSql(
      'alter table "tag_definition_group" add constraint "tag_definition_group_key_unique" unique ("key");',
    );

    this.addSql(
      'create table "tag_group_assoc" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "group_id" uuid not null, "tag_id" uuid not null, constraint "tag_group_assoc_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "tag_group_assoc_created_at_index" on "tag_group_assoc" ("created_at");',
    );

    this.addSql(
      'create table "users" ("id" uuid not null default uuid_generate_v4(), "created_at" timestamptz(3) not null, "created_by_id" uuid not null, "record_status" text check ("record_status" in (\'Active\', \'Inactive\')) not null default \'Active\', "updated_at" timestamptz(3) not null, "updated_by_id" uuid not null, "auth0id" uuid null, constraint "users_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index "users_created_at_index" on "users" ("created_at");',
    );

    this.addSql(
      'alter table "broker_emails" add constraint "broker_emails_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_contacts" add constraint "broker_contacts_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_addresses" add constraint "broker_addresses_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_rating_history" add constraint "broker_rating_history_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_rating_history" add constraint "broker_rating_history_reason_id_foreign" foreign key ("reason_id") references "broker_rating_reasons" ("id") on update cascade on delete set null;',
    );

    this.addSql(
      'alter table "client_payments" add constraint "client_payments_batch_payment_id_foreign" foreign key ("batch_payment_id") references "client_batch_payments" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_status_reasons_assoc" add constraint "client_status_reasons_assoc_client_status_reason__b74c2_foreign" foreign key ("client_status_reason_config_id") references "client_status_reason_configs" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "buyout_invoices" add constraint "buyout_invoices_factoring_company_id_foreign" foreign key ("factoring_company_id") references "factoring_companies" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "documents" add constraint "documents_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_client_payments" add constraint "invoice_client_payments_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_client_payments" add constraint "invoice_client_payments_client_payment_id_foreign" foreign key ("client_payment_id") references "client_payments" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_payments" add constraint "broker_payments_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_payment_reasons_assoc" add constraint "broker_payment_reasons_assoc_broker_payment_id_foreign" foreign key ("broker_payment_id") references "broker_payments" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_payment_reasons_assoc" add constraint "broker_payment_reasons_assoc_broker_payment_reason_id_foreign" foreign key ("broker_payment_reason_id") references "broker_payment_reasons" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_operation_id_foreign" foreign key ("operation_id") references "invoice_operations" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_processor_assoc" add constraint "invoice_processor_assoc_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves_client_payment" add constraint "reserves_client_payment_client_payment_id_foreign" foreign key ("client_payment_id") references "client_payments" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "reserves_client_payment" add constraint "reserves_client_payment_reserve_id_foreign" foreign key ("reserve_id") references "reserves" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves_broker_payment" add constraint "reserves_broker_payment_broker_payment_id_foreign" foreign key ("broker_payment_id") references "broker_payments" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "reserves_broker_payment" add constraint "reserves_broker_payment_reserve_id_foreign" foreign key ("reserve_id") references "reserves" ("id") on update cascade on delete cascade;',
    );

    this.addSql(
      'alter table "invoice_tag_assoc" add constraint "invoice_tag_assoc_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_tag_assoc" add constraint "invoice_tag_assoc_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_tag_definitions" add constraint "invoice_tag_definitions_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_tag_defi_0e0a1_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_factorin_f3151_foreign" foreign key ("factoring_client_bank_account_id") references "factoring_client_bank_accounts" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_tag_assoc" add constraint "client_tag_assoc_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_tag_assoc" add constraint "broker_tag_assoc_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_tag_assoc" add constraint "broker_tag_assoc_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_activity_log" add constraint "broker_activity_log_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_activity_log" add constraint "broker_activity_log_broker_id_foreign" foreign key ("broker_id") references "brokers" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_activity_log" add constraint "invoice_activity_log_tag_definition_id_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_activity_log" add constraint "invoice_activity_log_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "tag_group_assoc" add constraint "tag_group_assoc_group_id_foreign" foreign key ("group_id") references "tag_definition_group" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "tag_group_assoc" add constraint "tag_group_assoc_tag_id_foreign" foreign key ("tag_id") references "tag_definitions" ("id") on update cascade;',
    );
  }
}
