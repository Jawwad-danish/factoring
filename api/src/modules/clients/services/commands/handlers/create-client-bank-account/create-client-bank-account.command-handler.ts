import { ClientBankAccount } from '@fs-bobtail/factoring/data';
import { BasicCommandHandler } from '@module-cqrs';
import { CommandHandler } from '@nestjs/cqrs';
import { ClientApi } from '../../../../api';
import { CreateClientBankAccountCommand } from '../../create-client-bank-account.command';

@CommandHandler(CreateClientBankAccountCommand)
export class CreateClientBankAccountCommandHandler
  implements BasicCommandHandler<CreateClientBankAccountCommand>
{
  constructor(private readonly clientApi: ClientApi) {}

  async execute({
    request,
  }: CreateClientBankAccountCommand): Promise<ClientBankAccount> {
    const client = await this.clientApi.getById(request.clientId);

    const createBankAccountRequest = {
      ...request,
      clientId: client.id,
      createdBy: client.id,
    };

    const bankAccount = await this.clientApi.createBankAccount(
      createBankAccountRequest.clientId,
      createBankAccountRequest,
    );

    return bankAccount;
  }
}
