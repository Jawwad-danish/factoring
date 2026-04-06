import {
  BrokerFactoringConfigEntity,
  BrokerLimitAssocEntity,
} from '@module-persistence/entities';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerFactoringConfigDataAccess } from '../../../broker-factoring-config.data-access';
import { UpdateBrokerFactoringConfigCommand } from '../../update-broker-factoring-config.command';

@CommandHandler(UpdateBrokerFactoringConfigCommand)
export class UpdateBrokerFactoringConfigCommandHandler
  implements
    ICommandHandler<
      UpdateBrokerFactoringConfigCommand,
      BrokerFactoringConfigEntity
    >
{
  constructor(private readonly dataAccess: BrokerFactoringConfigDataAccess) {}

  async execute(
    command: UpdateBrokerFactoringConfigCommand,
  ): Promise<BrokerFactoringConfigEntity> {
    const { brokerId } = command;
    const config = await this.dataAccess.getOrCreateFactoringConfigForBroker(
      brokerId,
    );
    await this.update(config, command);
    return config;
  }

  private async update(
    config: BrokerFactoringConfigEntity,
    { request }: UpdateBrokerFactoringConfigCommand,
  ) {
    if (request.limitAmount !== undefined) {
      const history = new BrokerLimitAssocEntity();
      history.note = request.limitNote ?? '';
      history.limitAmount = request.limitAmount;
      config.limitHistory.add(history);
      config.limitAmount = request.limitAmount;
      config.preferences = request.preferences;
      config.verificationDelay = request.verificationDelay;
    }
  }
}
