import { CommandRunner } from '@module-cqrs';
import { BrokerFactoringConfigEntity } from '@module-persistence';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerApi } from '../../../../api';
import { BrokerMapper } from '../../../../data';
import { UpdateBrokerFactoringConfigCommand } from '../../update-broker-factoring-config.command';
import { UpdateBrokerCommand } from '../../update-broker.command';

@CommandHandler(UpdateBrokerCommand)
export class UpdateBrokerCommandHandler
  implements ICommandHandler<UpdateBrokerCommand, BrokerFactoringConfigEntity>
{
  constructor(
    private readonly brokerMapper: BrokerMapper,
    private readonly brokerApi: BrokerApi,
    private readonly commandRunner: CommandRunner,
  ) {}

  async execute({
    brokerId,
    request,
  }: UpdateBrokerCommand): Promise<BrokerFactoringConfigEntity> {
    const brokerConfig = await this.commandRunner.run(
      new UpdateBrokerFactoringConfigCommand(brokerId, request),
    );
    const apiRequest = this.brokerMapper.buildApiUpdateBrokerRequest(request);
    await this.brokerApi.update(brokerId, apiRequest);

    return brokerConfig;
  }
}
