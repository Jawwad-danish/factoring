import { Migration } from '@mikro-orm/migrations';

export class Migration20240228073734 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_reserve_rate_reasons" drop constraint if exists "client_reserve_rate_reasons_reason_check";',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"client_reserve_rate_reasons\" add constraint \"client_reserve_rate_reasons_reason_check\" check (\"reason\" in ('dilution_rate', 'volume', 'high_risk_brokers', 'general_risk', 'other', 'none'));",
    );
    this.addSql(
      'alter table "client_reserve_rate_reasons" alter column "reason" set default \'none\';',
    );

    this.addSql(
      'create index "client_factoring_configs_client_success_team_id_index" on "client_factoring_configs" ("client_success_team_id");',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" rename column "client_id" to "config_id";',
    );
    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" add constraint "client_reserve_rate_reasons_assoc_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;',
    );
    this.addSql(
      'create index "client_reserve_rate_reasons_assoc_reserve_rate_reason_id_index" on "client_reserve_rate_reasons_assoc" ("reserve_rate_reason_id");',
    );
    this.addSql(
      'create index "client_reserve_rate_reasons_assoc_config_id_index" on "client_reserve_rate_reasons_assoc" ("config_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "client_reserve_rate_reasons" drop constraint if exists "client_reserve_rate_reasons_reason_check";',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" drop constraint "client_reserve_rate_reasons_assoc_config_id_foreign";',
    );

    this.addSql(
      'drop index "client_factoring_configs_client_success_team_id_index";',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"client_reserve_rate_reasons\" add constraint \"client_reserve_rate_reasons_reason_check\" check (\"reason\" in ('dilution_rate', 'volume', 'high_risk_brokers', 'general_risk', 'other'));",
    );
    this.addSql(
      'alter table "client_reserve_rate_reasons" alter column "reason" set default \'other\';',
    );

    this.addSql(
      'drop index "client_reserve_rate_reasons_assoc_reserve_rate_reason_id_index";',
    );
    this.addSql(
      'drop index "client_reserve_rate_reasons_assoc_config_id_index";',
    );
    this.addSql(
      'alter table "client_reserve_rate_reasons_assoc" rename column "config_id" to "client_id";',
    );
  }
}
