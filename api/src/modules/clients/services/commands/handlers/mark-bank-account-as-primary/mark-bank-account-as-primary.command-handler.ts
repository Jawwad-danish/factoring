import { ClientBankAccount } from '@fs-bobtail/factoring/data';
import { BasicCommandHandler } from '@module-cqrs';
import { CommandHandler } from '@nestjs/cqrs';
import { ClientApi } from '../../../../api';
import { MarkBankAccountAsPrimaryCommand } from '../../mark-bank-account-as-primary.command';

@CommandHandler(MarkBankAccountAsPrimaryCommand)
export class MarkBankAccountAsPrimaryCommandHandler
  implements BasicCommandHandler<MarkBankAccountAsPrimaryCommand>
{
  constructor(private readonly clientApi: ClientApi) {}

  async execute(
    command: MarkBankAccountAsPrimaryCommand,
  ): Promise<ClientBankAccount> {
    const bankAccount = await this.clientApi.markBankAccountAsPrimary(
      command.clientId,
      command.bankAccountId,
    );

    return bankAccount;
  }
}
