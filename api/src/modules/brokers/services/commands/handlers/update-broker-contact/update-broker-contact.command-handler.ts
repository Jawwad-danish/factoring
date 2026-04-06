import { BrokerContact } from '../../../../data';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BrokerApi } from '../../../../api';
import { AppContextHolder } from '@core/app-context';
import { UpdateBrokerContactCommand } from '../../update-broker-contact.command';

@CommandHandler(UpdateBrokerContactCommand)
export class UpdateBrokerContactCommandHandler
  implements ICommandHandler<UpdateBrokerContactCommand, BrokerContact>
{
  constructor(private readonly brokerApi: BrokerApi) {}

  async execute(command: UpdateBrokerContactCommand): Promise<BrokerContact> {
    const userId = AppContextHolder.get().getAuthentication().principal.id;
    command.request.updatedBy = userId;
    return await this.brokerApi.updateBrokerContact(
      command.id,
      command.contactId,
      command.request,
    );
  }
}
