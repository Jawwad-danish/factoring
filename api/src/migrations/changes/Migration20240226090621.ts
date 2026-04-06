import { Migration } from '@mikro-orm/migrations';
import { ClientReserveRateReasonQueryGenerator } from '../utils/queries/client-reserve-rate-reason-query-generator';

export class Migration20240226090621 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new ClientReserveRateReasonQueryGenerator(
      this.driver,
    );

    const insertQuery = queryGenerator.insertMany(reasons);
    this.addSql(insertQuery);
  }

  async down(): Promise<void> {
    const queryGenerator = new ClientReserveRateReasonQueryGenerator(
      this.driver,
    );

    for (const reason of reasons) {
      this.addSql(queryGenerator.removeByCondition(reason));
    }
  }
}

const reasons = [
  {
    reason: 'dilution_rate',
  },
  {
    reason: 'volume',
  },
  {
    reason: 'high_risk_brokers',
  },
  {
    reason: 'general_risk',
  },
  {
    reason: 'other',
  },
];
