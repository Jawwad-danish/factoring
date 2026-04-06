import { Migration } from '@mikro-orm/migrations';

export class Migration20250612083407 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" drop constraint "factoring_client_bank_accounts_tag_assoc_factorin_f3151_foreign";`,
    );
    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" drop constraint "factoring_client_bank_accounts_tag_assoc_tag_defi_0e0a1_foreign";`,
    );

    this.addSql(
      `alter table "client_status_reasons_assoc" drop constraint "client_status_reasons_assoc_client_status_reason__b74c2_foreign";`,
    );

    this.addSql(
      `alter table "client_reserve_rate_reasons_assoc" drop constraint "client_reserve_rate_reasons_assoc_reserve_rate_reason_id_foreig";`,
    );

    this.addSql(
      `alter table "broker_payments_history" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`,
    );
    this.addSql(
      `alter table "broker_payments_history" alter column "entity_created_at" type timestamptz using ("entity_created_at"::timestamptz);`,
    );
    this.addSql(
      `alter table "broker_payments_history" alter column "batch_date" type timestamptz using ("batch_date"::timestamptz);`,
    );

    this.addSql(
      `alter table "client_factoring_configs_history" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`,
    );
    this.addSql(
      `alter table "client_factoring_configs_history" alter column "entity_created_at" type timestamptz using ("entity_created_at"::timestamptz);`,
    );

    this.addSql(
      `alter table "invoices_history" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "entity_created_at" type timestamptz using ("entity_created_at"::timestamptz);`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "payment_date" type timestamptz using ("payment_date"::timestamptz);`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "rejected_date" type timestamptz using ("rejected_date"::timestamptz);`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "purchased_date" type timestamptz using ("purchased_date"::timestamptz);`,
    );

    this.addSql(
      `alter table "peruse_jobs" add constraint "peruse_jobs_type_check" check("type" in ('bulk_classification', 'classification', 'verify_load', 'create_load'));`,
    );
    this.addSql(
      `alter table "peruse_jobs" add constraint "peruse_jobs_status_check" check("status" in ('in_progress', 'done', 'error'));`,
    );

    this.addSql(
      `alter table "pending_buyouts" alter column "payment_date" type timestamptz using ("payment_date"::timestamptz);`,
    );

    this.addSql(
      `alter table "invoices" alter column "payment_date" type timestamptz using ("payment_date"::timestamptz);`,
    );
    this.addSql(
      `alter table "invoices" alter column "rejected_date" type timestamptz using ("rejected_date"::timestamptz);`,
    );
    this.addSql(
      `alter table "invoices" alter column "purchased_date" type timestamptz using ("purchased_date"::timestamptz);`,
    );

    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_tag_def_0e0a1_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_factori_f3151_foreign" foreign key ("factoring_client_bank_account_id") references "factoring_client_bank_accounts" ("id") on update cascade;`,
    );
    this.addSql(
      `alter index "factoring_client_bank_accounts_tag_assoc_factoring__16102_index" rename to "factoring_client_bank_accounts_tag_assoc_factoring_16102_index";`,
    );

    this.addSql(
      `alter table "client_status_reasons_assoc" add constraint "client_status_reasons_assoc_client_status_reason_b74c2_foreign" foreign key ("client_status_reason_config_id") references "client_status_reason_configs" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "client_reserve_rate_reasons_assoc" add constraint "client_reserve_rate_reasons_assoc_reserve_rate_r_48b0b_foreign" foreign key ("reserve_rate_reason_id") references "client_reserve_rate_reasons" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "users_history" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`,
    );
    this.addSql(
      `alter table "users_history" alter column "entity_created_at" type timestamptz using ("entity_created_at"::timestamptz);`,
    );

    this.addSql(
      `comment on column "report_documents"."report_name" is 'The specific type of report generated';`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "client_reserve_rate_reasons_assoc" drop constraint "client_reserve_rate_reasons_assoc_reserve_rate_r_48b0b_foreign";`,
    );

    this.addSql(
      `alter table "client_status_reasons_assoc" drop constraint "client_status_reasons_assoc_client_status_reason_b74c2_foreign";`,
    );

    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" drop constraint "factoring_client_bank_accounts_tag_assoc_tag_def_0e0a1_foreign";`,
    );
    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" drop constraint "factoring_client_bank_accounts_tag_assoc_factori_f3151_foreign";`,
    );

    this.addSql(
      `alter table "peruse_jobs" drop constraint if exists "peruse_jobs_type_check";`,
    );
    this.addSql(
      `alter table "peruse_jobs" drop constraint if exists "peruse_jobs_status_check";`,
    );

    this.addSql(
      `alter table "broker_payments_history" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "broker_payments_history" alter column "entity_created_at" type timestamptz(0) using ("entity_created_at"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "broker_payments_history" alter column "batch_date" type timestamptz(0) using ("batch_date"::timestamptz(0));`,
    );

    this.addSql(
      `alter table "client_factoring_configs_history" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "client_factoring_configs_history" alter column "entity_created_at" type timestamptz(0) using ("entity_created_at"::timestamptz(0));`,
    );

    this.addSql(
      `alter table "client_reserve_rate_reasons_assoc" add constraint "client_reserve_rate_reasons_assoc_reserve_rate_reason_id_foreig" foreign key ("reserve_rate_reason_id") references "client_reserve_rate_reasons" ("id") on update cascade on delete no action;`,
    );

    this.addSql(
      `alter table "client_status_reasons_assoc" add constraint "client_status_reasons_assoc_client_status_reason__b74c2_foreign" foreign key ("client_status_reason_config_id") references "client_status_reason_configs" ("id") on update cascade on delete no action;`,
    );

    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_factorin_f3151_foreign" foreign key ("factoring_client_bank_account_id") references "factoring_client_bank_accounts" ("id") on update cascade on delete no action;`,
    );
    this.addSql(
      `alter table "factoring_client_bank_accounts_tag_assoc" add constraint "factoring_client_bank_accounts_tag_assoc_tag_defi_0e0a1_foreign" foreign key ("tag_definition_id") references "tag_definitions" ("id") on update cascade on delete no action;`,
    );
    this.addSql(
      `alter index "factoring_client_bank_accounts_tag_assoc_factoring_16102_index" rename to "factoring_client_bank_accounts_tag_assoc_factoring__16102_index";`,
    );

    this.addSql(
      `alter table "invoices" alter column "payment_date" type timestamptz(0) using ("payment_date"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "invoices" alter column "rejected_date" type timestamptz(0) using ("rejected_date"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "invoices" alter column "purchased_date" type timestamptz(0) using ("purchased_date"::timestamptz(0));`,
    );

    this.addSql(
      `alter table "invoices_history" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "entity_created_at" type timestamptz(0) using ("entity_created_at"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "payment_date" type timestamptz(0) using ("payment_date"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "rejected_date" type timestamptz(0) using ("rejected_date"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "invoices_history" alter column "purchased_date" type timestamptz(0) using ("purchased_date"::timestamptz(0));`,
    );

    this.addSql(
      `alter table "pending_buyouts" alter column "payment_date" type timestamptz(0) using ("payment_date"::timestamptz(0));`,
    );

    this.addSql(
      `alter table "peruse_jobs" alter column "type" type text using ("type"::text);`,
    );
    this.addSql(
      `alter table "peruse_jobs" alter column "status" type text using ("status"::text);`,
    );

    this.addSql(
      `comment on column "report_documents"."report_name" is 'The specific type of report generated (e.g., ClientTotalReserve).';`,
    );

    this.addSql(
      `alter table "users_history" alter column "created_at" type timestamptz(0) using ("created_at"::timestamptz(0));`,
    );
    this.addSql(
      `alter table "users_history" alter column "entity_created_at" type timestamptz(0) using ("entity_created_at"::timestamptz(0));`,
    );
  }
}
