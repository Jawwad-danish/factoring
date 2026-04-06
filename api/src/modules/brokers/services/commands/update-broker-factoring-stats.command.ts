import { Command } from '@module-cqrs';
import { BrokerFactoringStatsEntity } from '@module-persistence/entities';

export class UpdateBrokerFactoringStatsCommand extends Command<BrokerFactoringStatsEntity> {
  constructor(readonly brokerId: string) {
    super();
  }
}
