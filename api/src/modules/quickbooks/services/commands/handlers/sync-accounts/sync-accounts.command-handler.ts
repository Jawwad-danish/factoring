import { Account } from '@balancer-team/quickbooks/dist/schemas';
import { CrossCuttingConcerns } from '@core/util';
import { BasicCommandHandler } from '@module-cqrs';
import { QuickbooksAccountsRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { QuickbooksApi } from '../../../../api';
import { SyncAccountsCommand } from '../../sync-accounts.command';

@Injectable()
@CommandHandler(SyncAccountsCommand)
export class SyncAccountsCommandHandler
  implements BasicCommandHandler<SyncAccountsCommand>
{
  private logger = new Logger(SyncAccountsCommandHandler.name);

  constructor(
    private readonly quickbooksAccountsRepository: QuickbooksAccountsRepository,
    private readonly quickbooksApi: QuickbooksApi,
  ) {}

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Syncing accounts',
      };
    },
    observability: {
      tag: ['quickbooks', 'sync-accounts'],
    },
  })
  async execute(): Promise<void> {
    const [unsyncedAccounts] = await this.quickbooksAccountsRepository.findAll({
      quickbooksId: null,
    });

    if (unsyncedAccounts.length === 0) {
      this.logger.warn('No accounts to sync');
      return;
    }

    const quickbooksAccounts = await this.getAccounts();

    for (const account of unsyncedAccounts) {
      const accountFromApi = quickbooksAccounts.find(
        (a) => a.Name === account.name,
      );
      if (!accountFromApi) {
        this.logger.warn(`Account ${account.name} not found in Quickbooks`);
        continue;
      }
      account.quickbooksId = accountFromApi.Id;
    }
  }

  private async getAccounts(): Promise<Account[]> {
    return this.quickbooksApi.getAccounts();
  }
}
