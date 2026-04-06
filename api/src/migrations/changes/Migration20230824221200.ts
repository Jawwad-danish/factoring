import { Migration } from '@mikro-orm/migrations';
import {
  ClientFactoringStatus,
  ClientStatusReason,
} from '../../modules/persistence';
import { ClientStatusReasonConfigQueryGenerator } from '../utils';

export class Migration20230824221200 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new ClientStatusReasonConfigQueryGenerator(
      this.driver,
    );

    const insertQuery = queryGenerator.insertMany(configs);
    this.addSql(insertQuery);
  }

  async down(): Promise<void> {
    const queryGenerator = new ClientStatusReasonConfigQueryGenerator(
      this.driver,
    );
    for (const config of configs) {
      this.addSql(queryGenerator.removeByCondition(config));
    }
  }
}

const configs = [
  {
    status: ClientFactoringStatus.Hold,
    reason: ClientStatusReason.Fraud,
    notifyClient: false,
    displayMessage: false,
  },
  {
    status: ClientFactoringStatus.Hold,
    reason: ClientStatusReason.FMCSAIssues,
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: ClientFactoringStatus.Hold,
    reason: ClientStatusReason.Other,
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: ClientFactoringStatus.Released,
    reason: ClientStatusReason.BuyoutInProgress,
    notifyClient: true,
    displayMessage: true,
  },
  {
    status: ClientFactoringStatus.Released,
    reason: ClientStatusReason.Other,
    notifyClient: true,
    displayMessage: true,
  },
];
