import { Migration } from '@mikro-orm/migrations';

export class Migration20240131105009 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "tag_definition_group" add constraint "tag_definition_group_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "tag_definition_group" add constraint "tag_definition_group_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "tag_definitions" add constraint "tag_definitions_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "tag_definitions" add constraint "tag_definitions_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "tag_group_assoc" add constraint "tag_group_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves" add constraint "reserves_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "operations" add constraint "operations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "operations" add constraint "operations_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_tag_definitions" add constraint "invoice_tag_definitions_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_tag_definitions" add constraint "invoice_tag_definitions_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "factoring_companies" add constraint "factoring_companies_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "factoring_companies" add constraint "factoring_companies_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "pending_buyouts_batch" add constraint "pending_buyouts_batch_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "pending_buyouts_batch" add constraint "pending_buyouts_batch_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves_buyout_batch" add constraint "reserves_buyout_batch_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "reserves_buyout_batch" add constraint "reserves_buyout_batch_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "pending_buyouts" add constraint "pending_buyouts_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "pending_buyouts" add constraint "pending_buyouts_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoices" add constraint "invoices_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoices" add constraint "invoices_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_tag_assoc" add constraint "invoice_tag_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_processor_assoc" add constraint "invoice_processor_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_processor_assoc" add constraint "invoice_processor_assoc_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_operations" add constraint "invoice_operations_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "documents" add constraint "documents_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "documents" add constraint "documents_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "factoring_client_bank_accounts" add constraint "factoring_client_bank_accounts_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "factoring_client_bank_accounts" add constraint "factoring_client_bank_accounts_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_tag_assoc" add constraint "client_tag_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_success_teams" add constraint "client_success_teams_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_success_teams" add constraint "client_success_teams_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_status_reason_configs" add constraint "client_status_reason_configs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_status_reason_configs" add constraint "client_status_reason_configs_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_status_reasons_assoc" add constraint "client_status_reasons_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_factoring_configs" add constraint "client_factoring_configs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_factoring_configs" add constraint "client_factoring_configs_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_broker_assignments" add constraint "client_broker_assignments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_broker_assignments" add constraint "client_broker_assignments_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_batch_payments" add constraint "client_batch_payments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_batch_payments" add constraint "client_batch_payments_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "client_payments" add constraint "client_payments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "client_payments" add constraint "client_payments_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves_client_payment" add constraint "reserves_client_payment_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "reserves_client_payment" add constraint "reserves_client_payment_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_client_payments" add constraint "invoice_client_payments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "invoice_client_payments" add constraint "invoice_client_payments_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_payment_reasons" add constraint "broker_payment_reasons_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_payment_reasons" add constraint "broker_payment_reasons_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_payments" add constraint "broker_payments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "broker_payments" add constraint "broker_payments_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "reserves_broker_payment" add constraint "reserves_broker_payment_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
    this.addSql(
      'alter table "reserves_broker_payment" add constraint "reserves_broker_payment_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "broker_payment_reasons_assoc" add constraint "broker_payment_reasons_assoc_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );

    this.addSql(
      'alter table "invoice_activity_log" add constraint "invoice_activity_log_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "broker_payment_reasons" drop constraint "broker_payment_reasons_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "broker_payment_reasons" drop constraint "broker_payment_reasons_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "broker_payment_reasons_assoc" drop constraint "broker_payment_reasons_assoc_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "broker_payments" drop constraint "broker_payments_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "broker_payments" drop constraint "broker_payments_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_batch_payments" drop constraint "client_batch_payments_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "client_batch_payments" drop constraint "client_batch_payments_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_broker_assignments" drop constraint "client_broker_assignments_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "client_broker_assignments" drop constraint "client_broker_assignments_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_factoring_configs" drop constraint "client_factoring_configs_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "client_factoring_configs" drop constraint "client_factoring_configs_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_payments" drop constraint "client_payments_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "client_payments" drop constraint "client_payments_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_status_reason_configs" drop constraint "client_status_reason_configs_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "client_status_reason_configs" drop constraint "client_status_reason_configs_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_status_reasons_assoc" drop constraint "client_status_reasons_assoc_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_success_teams" drop constraint "client_success_teams_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "client_success_teams" drop constraint "client_success_teams_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "client_tag_assoc" drop constraint "client_tag_assoc_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "documents" drop constraint "documents_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "documents" drop constraint "documents_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "factoring_client_bank_accounts" drop constraint "factoring_client_bank_accounts_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "factoring_client_bank_accounts" drop constraint "factoring_client_bank_accounts_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "factoring_client_bank_accounts_tag_assoc" drop constraint "factoring_client_bank_accounts_tag_assoc_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "factoring_companies" drop constraint "factoring_companies_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "factoring_companies" drop constraint "factoring_companies_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoice_activity_log" drop constraint "invoice_activity_log_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoice_client_payments" drop constraint "invoice_client_payments_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "invoice_client_payments" drop constraint "invoice_client_payments_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoice_operations" drop constraint "invoice_operations_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoice_processor_assoc" drop constraint "invoice_processor_assoc_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "invoice_processor_assoc" drop constraint "invoice_processor_assoc_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoice_tag_assoc" drop constraint "invoice_tag_assoc_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoice_tag_definitions" drop constraint "invoice_tag_definitions_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "invoice_tag_definitions" drop constraint "invoice_tag_definitions_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "invoices" drop constraint "invoices_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "invoices" drop constraint "invoices_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "operations" drop constraint "operations_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "operations" drop constraint "operations_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "pending_buyouts" drop constraint "pending_buyouts_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "pending_buyouts" drop constraint "pending_buyouts_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "pending_buyouts_batch" drop constraint "pending_buyouts_batch_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "pending_buyouts_batch" drop constraint "pending_buyouts_batch_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "reserves" drop constraint "reserves_created_by_id_foreign";',
    );

    this.addSql(
      'alter table "reserves_broker_payment" drop constraint "reserves_broker_payment_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "reserves_broker_payment" drop constraint "reserves_broker_payment_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "reserves_buyout_batch" drop constraint "reserves_buyout_batch_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "reserves_buyout_batch" drop constraint "reserves_buyout_batch_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "reserves_client_payment" drop constraint "reserves_client_payment_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "reserves_client_payment" drop constraint "reserves_client_payment_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "tag_definition_group" drop constraint "tag_definition_group_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "tag_definition_group" drop constraint "tag_definition_group_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "tag_definitions" drop constraint "tag_definitions_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "tag_definitions" drop constraint "tag_definitions_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "tag_group_assoc" drop constraint "tag_group_assoc_created_by_id_foreign";',
    );
  }
}
