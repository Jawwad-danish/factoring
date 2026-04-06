import { CreateBrokerCommand } from '../../create-broker.command';
import { BrokerFactoringConfigEntity } from '@module-persistence';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerApi } from '../../../../api';
import { BrokerMapper } from '../../../../data';

@CommandHandler(CreateBrokerCommand)
export class CreateBrokerCommandHandler
  implements ICommandHandler<CreateBrokerCommand, BrokerFactoringConfigEntity>
{
  constructor(
    private readonly brokerMapper: BrokerMapper,
    private readonly brokerApi: BrokerApi,
  ) {}

  async execute({
    request,
  }: CreateBrokerCommand): Promise<BrokerFactoringConfigEntity> {
    const brokerConfig = await this.brokerMapper.buildConfig();
    const apiRequest = this.brokerMapper.buildApiCreateBrokerRequest(request, {
      brokerId: brokerConfig.brokerId,
    });
    await this.brokerApi.create(apiRequest);

    return brokerConfig;
  }
}
