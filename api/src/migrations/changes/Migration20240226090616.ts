import { Migration } from '@mikro-orm/migrations';
import { ClientFactorRateReasonQueryGenerator } from '../utils/queries/client-factoring-rate-reason-query-generator';

export class Migration20240226090616 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new ClientFactorRateReasonQueryGenerator(
      this.driver,
    );

    const insertQuery = queryGenerator.insertMany(reasons);
    this.addSql(insertQuery);

    this.addSql(
      'alter table "client_reserve_rate_reasons" drop constraint if exists "client_reserve_rate_reasons_reason_check";',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"client_reserve_rate_reasons\" add constraint \"client_reserve_rate_reasons_reason_check\" check (\"reason\" in ('dilution_rate', 'volume', 'high_risk_brokers', 'general_risk', 'other'));",
    );
  }

  async down(): Promise<void> {
    const queryGenerator = new ClientFactorRateReasonQueryGenerator(
      this.driver,
    );

    for (const reason of reasons) {
      this.addSql(queryGenerator.removeByCondition(reason));
    }

    this.addSql(
      'alter table "client_reserve_rate_reasons" drop constraint if exists "client_reserve_rate_reasons_reason_check";',
    );

    this.addSql(
      'alter table "client_reserve_rate_reasons" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"client_reserve_rate_reasons\" add constraint \"client_reserve_rate_reasons_reason_check\" check (\"reason\" in ('dillution_rate', 'volume', 'high_risk_brokers', 'general_risk', 'other'));",
    );
  }
}

const reasons = [
  {
    reason: 'rate_correction',
  },
  {
    reason: 'rate_increase',
  },
  {
    reason: 'lower_rate_request',
  },
  {
    reason: 'none',
  },
];
