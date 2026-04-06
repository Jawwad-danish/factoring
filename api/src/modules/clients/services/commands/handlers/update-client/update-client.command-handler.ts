import { CommandRunner } from '@module-cqrs';
import { ClientFactoringConfigsEntity } from '@module-persistence';
import { UpdateUserCommand, UpdateUserRequest } from '@module-users';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ClientApi } from '../../../../api';
import { ClientMapper } from '../../../../data';
import { UpdateClientFactoringConfigCommand } from '../../update-client-factoring-config.command';
import { UpdateClientCommand } from '../../update-client.command';

@CommandHandler(UpdateClientCommand)
export class UpdateClientCommandHandler
  implements ICommandHandler<UpdateClientCommand, ClientFactoringConfigsEntity>
{
  constructor(
    private readonly clientMapper: ClientMapper,
    private readonly clientApi: ClientApi,
    private readonly commandRunner: CommandRunner,
  ) {}

  async execute({
    clientId,
    request,
  }: UpdateClientCommand): Promise<ClientFactoringConfigsEntity> {
    const config = await this.commandRunner.run(
      new UpdateClientFactoringConfigCommand(
        clientId,
        this.clientMapper.buildUpdateClientFactoringConfigRequest(request),
      ),
    );
    if (request.email) {
      await this.commandRunner.run(
        new UpdateUserCommand(
          config.user.id,
          new UpdateUserRequest({ email: request.email }),
        ),
      );
    }
    const apiRequest = this.clientMapper.buildApiUpdateClientRequest(request);
    await this.clientApi.update(clientId, apiRequest);
    return config;
  }
}
