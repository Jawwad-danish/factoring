import { QueryCriteria } from '@core/data';
import { CrossCuttingConcerns } from '@core/util';
import { Transactional } from '@module-database';
import { Injectable } from '@nestjs/common';
import { CommandRunner, QueryRunner } from '../../cqrs';
import { QuickbooksApi } from '../api';
import {
  SyncAccountsCommand,
  SyncJournalEntryCommand,
  SyncQuickbooksClientsCommand,
} from './commands';
import {
  FindJournalEntriesQuery,
  FindJournalEntriesQueryResult,
} from './queries';

@Injectable()
export class QuickbooksService {
  constructor(
    private readonly quickbooksApi: QuickbooksApi,
    private readonly queryRunner: QueryRunner,
    private readonly commandRunner: CommandRunner,
  ) {}

  async findJournalEntries(
    criteria: QueryCriteria,
  ): Promise<FindJournalEntriesQueryResult> {
    return this.queryRunner.run(new FindJournalEntriesQuery(criteria));
  }

  async getAuthorizationUrl(returnUrl: string): Promise<string> {
    return this.quickbooksApi.getAuthorizationUrl(returnUrl);
  }

  async finishAuth(
    code: string,
    state: string,
    realmId: string,
  ): Promise<string> {
    return this.quickbooksApi.finishAuth(code, state, realmId);
  }

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
  @Transactional('quickbooks-sync-accounts')
  async syncAccounts(): Promise<void> {
    return this.commandRunner.run(new SyncAccountsCommand());
  }

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Syncing clients',
      };
    },
    observability: {
      tag: ['quickbooks', 'sync-clients'],
    },
  })
  @Transactional('quickbooks-sync-clients')
  async syncClients(): Promise<void> {
    return this.commandRunner.run(new SyncQuickbooksClientsCommand());
  }

  @CrossCuttingConcerns({
    logging: (journalEntryId: string) => {
      return {
        message: `Syncing journal entry ${journalEntryId} to Quickbooks`,
      };
    },
    observability: {
      tag: ['quickbooks', 'sync-journal-entry'],
    },
  })
  @Transactional('quickbooks-sync-journal-entry')
  async syncJournalEntry(journalEntryId: string): Promise<void> {
    await this.syncAccounts();
    return await this.commandRunner.run(
      new SyncJournalEntryCommand(journalEntryId),
    );
  }
}
