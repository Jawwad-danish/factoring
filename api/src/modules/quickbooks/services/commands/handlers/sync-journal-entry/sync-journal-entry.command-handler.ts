import { JournalEntry } from '@balancer-team/quickbooks/dist/schemas';
import { BasicCommandHandler } from '@module-cqrs';
import {
  QuickbooksJournalEntryEntity,
  QuickbooksJournalEntryStatus,
} from '@module-persistence';
import { QuickbooksJournalEntryRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { ValidationError } from '../../../../../../core/validation';
import { QuickbooksApi } from '../../../../api';
import { QuickbooksJournalEntryApiMapper } from '../../../../api/quickbooks-journal-entry.api-mapper';
import { SyncJournalEntryCommand } from '../../sync-journal-entry.command';

@Injectable()
@CommandHandler(SyncJournalEntryCommand)
export class SyncJournalEntryCommandHandler
  implements BasicCommandHandler<SyncJournalEntryCommand>
{
  private logger = new Logger(SyncJournalEntryCommandHandler.name);

  constructor(
    private readonly journalEntryRepository: QuickbooksJournalEntryRepository,
    private readonly journalEntryApiMapper: QuickbooksJournalEntryApiMapper,
    private readonly quickbooksApi: QuickbooksApi,
  ) {}

  async execute(command: SyncJournalEntryCommand): Promise<void> {
    const journalEntry = await this.loadJournalEntry(command.journalEntryId);

    if (journalEntry.status === QuickbooksJournalEntryStatus.Synced) {
      throw new ValidationError(
        'journal-entry-already-synced',
        `Journal entry ${journalEntry.docName} is already synced to Quickbooks`,
      );
    }

    const apiJournalEntry =
      await this.journalEntryApiMapper.entityToApiJournalEntry(journalEntry);

    const createdJournalEntry = await this.quickbooksApi.createJournalEntry(
      apiJournalEntry,
    );

    this.updateJournalEntryAfterSync(journalEntry, createdJournalEntry);

    this.logger.log(
      `Successfully synced journal entry ${command.journalEntryId} to Quickbooks with ID ${createdJournalEntry.Id}`,
    );
  }

  private async loadJournalEntry(
    journalEntryId: string,
  ): Promise<QuickbooksJournalEntryEntity> {
    const journalEntry = await this.journalEntryRepository.getOneById(
      journalEntryId,
      {
        populate: [
          'lines.account',
          'lines.brokerPayment',
          'lines.batchPayment',
          'lines.clientPayment',
          'lines.invoice',
          'lines.reserve',
        ],
      },
    );

    return journalEntry;
  }

  private updateJournalEntryAfterSync(
    journalEntry: QuickbooksJournalEntryEntity,
    createdJournalEntry: JournalEntry,
  ): void {
    journalEntry.status = QuickbooksJournalEntryStatus.Synced;
    journalEntry.quickbooksId = createdJournalEntry.Id;
    journalEntry.syncedAt = new Date();
  }
}
