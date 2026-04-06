import {
  ClientFactoringConfigsEntity,
  ClientFactoringConfigsRepository,
  UserRepository,
} from '@module-persistence';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClientApi } from '../../../../api';
import { ClientMapper } from '../../../../data';
import { CreateClientCommand } from '../../create-client.command';

@CommandHandler(CreateClientCommand)
export class CreateClientCommandHandler
  implements ICommandHandler<CreateClientCommand, ClientFactoringConfigsEntity>
{
  constructor(
    private readonly clientMapper: ClientMapper,
    private readonly clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
    private readonly clientApi: ClientApi,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({
    request,
  }: CreateClientCommand): Promise<ClientFactoringConfigsEntity> {
    const { clientConfig, user } =
      await this.clientMapper.buildConfigFromRequest(request);
    await this.userRepository.persistAndFlush(user);
    await this.clientFactoringConfigsRepository.persistAndFlush(clientConfig);
    const apiRequest = this.clientMapper.buildApiCreateClientRequest(request, {
      clientId: clientConfig.clientId,
    });
    await this.clientApi.create(apiRequest);
    return clientConfig;
  }
}
