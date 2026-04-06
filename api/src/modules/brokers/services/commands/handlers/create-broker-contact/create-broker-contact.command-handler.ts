import { BrokerContact } from '../../../../data';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerApi } from '../../../../api';
import { AppContextHolder } from '@core/app-context';
import { CreateBrokerContactCommand } from '../../create-broker-contact-command';

@CommandHandler(CreateBrokerContactCommand)
export class CreateBrokerContactCommandHandler
  implements ICommandHandler<CreateBrokerContactCommand, BrokerContact>
{
  constructor(private readonly brokerApi: BrokerApi) {}

  async execute(command: CreateBrokerContactCommand): Promise<BrokerContact> {
    const userId = AppContextHolder.get().getAuthentication().principal.id;
    command.request.createdBy = userId;
    return await this.brokerApi.createBrokerContact(
      command.id,
      command.request,
    );
  }
}
