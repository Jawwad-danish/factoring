import { Migration } from '@mikro-orm/migrations';
import { ClientFactoringStatus, ClientStatusReason } from '@module-persistence';
import { ClientStatusReasonConfigQueryGenerator } from '../utils';

export class Migration20240318103102 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "client_status_reason_configs" drop constraint if exists "client_status_reason_configs_status_check";',
    );
    this.addSql(
      'alter table "client_status_reason_configs" drop constraint if exists "client_status_reason_configs_reason_check";',
    );

    this.addSql(
      'alter table "client_factoring_configs" drop constraint if exists "client_factoring_configs_status_check";',
    );

    this.addSql(
      'alter table "client_status_reason_configs" alter column "status" type text using ("status"::text);',
    );
    this.addSql(
      "alter table \"client_status_reason_configs\" add constraint \"client_status_reason_configs_status_check\" check (\"status\" in ('active', 'onboarding', 'hold', 'released'));",
    );
    this.addSql(
      'alter table "client_status_reason_configs" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"client_status_reason_configs\" add constraint \"client_status_reason_configs_reason_check\" check (\"reason\" in ('fraud', 'fmcsa_issues', 'buyout_in_progress', 'other', 'switched_factoring_company', 'insurance_issues', 'no_longer_factoring', 'ready_to_factor', 'submitting_invoices', 'invoice_issues', 'additional_information_required', 'client_limit_exceeded', 'previous_write_off', 'inactivity'));",
    );

    this.addSql(
      'alter table "client_factoring_configs" alter column "status" type text using ("status"::text);',
    );
    this.addSql(
      "alter table \"client_factoring_configs\" add constraint \"client_factoring_configs_status_check\" check (\"status\" in ('active', 'onboarding', 'hold', 'released'));",
    );
    this.addSql(
      'alter table "client_factoring_configs" alter column "status" set default \'onboarding\';',
    );

    this.addSql(
      'alter table "client_status_reasons_assoc" alter column "note" type text using ("note"::text);',
    );
    this.addSql(
      'alter table "client_status_reasons_assoc" rename column "client_id" to "config_id";',
    );
    this.addSql(
      'alter table "client_status_reasons_assoc" add constraint "client_status_reasons_assoc_config_id_foreign" foreign key ("config_id") references "client_factoring_configs" ("id") on update cascade;',
    );
    this.addSql(
      'create index "client_status_reasons_assoc_client_status_reason_config_id_index" on "client_status_reasons_assoc" ("client_status_reason_config_id");',
    );
    this.addSql(
      'create index "client_status_reasons_assoc_config_id_index" on "client_status_reasons_assoc" ("config_id");',
    );

    const queryGenerator = new ClientStatusReasonConfigQueryGenerator(
      this.driver,
    );

    const insertQuery = queryGenerator.insertMany(insertConfigs);
    this.addSql(insertQuery);

    for (const config of updateConfigs) {
      this.addSql(
        queryGenerator.updateReason(
          config.status,
          config.reason,
          config.updateData,
        ),
      );
    }
  }

  async down(): Promise<void> {
    const queryGenerator = new ClientStatusReasonConfigQueryGenerator(
      this.driver,
    );
    for (const config of insertConfigs) {
      this.addSql(queryGenerator.removeByCondition(config));
    }

    for (const config of revertUpdateConfigs) {
      this.addSql(
        queryGenerator.updateReason(
          config.status,
          config.reason,
          config.updateData,
        ),
      );
    }

    this.addSql(
      'alter table "client_factoring_configs" drop constraint if exists "client_factoring_configs_status_check";',
    );

    this.addSql(
      'alter table "client_status_reason_configs" drop constraint if exists "client_status_reason_configs_status_check";',
    );
    this.addSql(
      'alter table "client_status_reason_configs" drop constraint if exists "client_status_reason_configs_reason_check";',
    );

    this.addSql(
      'alter table "client_status_reasons_assoc" drop constraint "client_status_reasons_assoc_config_id_foreign";',
    );

    this.addSql(
      'alter table "client_factoring_configs" alter column "status" type text using ("status"::text);',
    );
    this.addSql(
      "alter table \"client_factoring_configs\" add constraint \"client_factoring_configs_status_check\" check (\"status\" in ('active', 'on boarding', 'hold', 'released'));",
    );
    this.addSql(
      'alter table "client_factoring_configs" alter column "status" set default \'on boarding\';',
    );

    this.addSql(
      'alter table "client_status_reason_configs" alter column "status" type text using ("status"::text);',
    );
    this.addSql(
      "alter table \"client_status_reason_configs\" add constraint \"client_status_reason_configs_status_check\" check (\"status\" in ('active', 'on boarding', 'hold', 'released'));",
    );
    this.addSql(
      'alter table "client_status_reason_configs" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"client_status_reason_configs\" add constraint \"client_status_reason_configs_reason_check\" check (\"reason\" in ('fraud', 'fmcsa_issues', 'buyout_in_progress', 'other', 'competitor', 'insurance_issues', 'not_submitting_invoices', 'out_of_business', 'possible_double_factor', 'requesting_a_loan', 'stopped_factoring'));",
    );

    this.addSql(
      'alter table "client_status_reasons_assoc" alter column "note" type varchar using ("note"::varchar);',
    );
    this.addSql(
      'drop index "client_status_reasons_assoc_client_status_reason_config_id_index";',
    );
    this.addSql('drop index "client_status_reasons_assoc_config_id_index";');
    this.addSql(
      'alter table "client_status_reasons_assoc" rename column "config_id" to "client_id";',
    );
  }
}

const onboardingConfigs = [
  {
    status: 'onboarding',
    reason: 'other',
    notifyClient: false,
    displayMessage: false,
  },
];

const activeConfigs = [
  {
    status: 'active',
    reason: 'other',
    notifyClient: false,
    displayMessage: false,
  },
  {
    status: 'active',
    reason: 'ready_to_factor',
    notifyClient: false,
    displayMessage: false,
  },
  {
    status: 'active',
    reason: 'submitting_invoices',
    notifyClient: false,
    displayMessage: false,
  },
];

const holdConfigs = [
  {
    status: 'hold',
    reason: 'invoice_issues',
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: 'hold',
    reason: 'additional_information_required',
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: 'hold',
    reason: 'inactivity',
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: 'hold',
    reason: 'client_limit_exceeded',
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: 'hold',
    reason: 'insurance_issues',
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: 'hold',
    reason: 'previous_write_off',
    notifyClient: true,
    displayMessage: true,
  },
];

const releaseConfigs = [
  {
    status: 'released',
    reason: 'switched_factoring_company',
    notifyClient: false,
    displayMessage: false,
  },
  {
    status: 'released',
    reason: 'no_longer_factoring',
    notifyClient: false,
    displayMessage: false,
  },
];

const insertConfigs = [
  ...onboardingConfigs,
  ...activeConfigs,
  ...holdConfigs,
  ...releaseConfigs,
];

const updateBuyoutConfig = {
  status: 'released' as ClientFactoringStatus,
  reason: 'buyout_in_progress' as ClientStatusReason,
  updateData: {
    status: 'hold' as ClientFactoringStatus,
    reason: 'buyout_in_progress' as ClientStatusReason,
  },
};

const revertBuyoutConfig = {
  status: 'hold' as ClientFactoringStatus,
  reason: 'buyout_in_progress' as ClientStatusReason,
  updateData: {
    status: 'released' as ClientFactoringStatus,
    reason: 'buyout_in_progress' as ClientStatusReason,
  },
};

const updateHoldOtherConfig = {
  status: 'hold' as ClientFactoringStatus,
  reason: 'other' as ClientStatusReason,
  updateData: {
    notify_client: false,
    display_message: false,
  },
};

const updateReleaseOtherConfig = {
  status: 'released' as ClientFactoringStatus,
  reason: 'other' as ClientStatusReason,
  updateData: {
    notify_client: false,
    display_message: false,
  },
};

const revertHoldOtherConfig = {
  status: 'hold' as ClientFactoringStatus,
  reason: 'other' as ClientStatusReason,
  updateData: {
    notify_client: true,
    display_message: true,
  },
};

const revertReleaseOtherConfig = {
  status: 'released' as ClientFactoringStatus,
  reason: 'other' as ClientStatusReason,
  updateData: {
    notify_client: true,
    display_message: true,
  },
};

const updateConfigs = [
  updateBuyoutConfig,
  updateHoldOtherConfig,
  updateReleaseOtherConfig,
];

const revertUpdateConfigs = [
  revertBuyoutConfig,
  revertHoldOtherConfig,
  revertReleaseOtherConfig,
];
