import { Observability } from '@core/observability';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { QuickbooksJournalEntryType } from '@module-persistence/entities';
import { Repositories } from '@module-persistence/repositories';
import { TransferCreated } from '@module-transfers/data';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JournalEntryStrategyFactory } from '../journal-entries/strategies';

@Injectable()
export class JournalEntryEventOrchestrator {
  private logger: Logger = new Logger(JournalEntryEventOrchestrator.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly journalEntryStrategyFactory: JournalEntryStrategyFactory,
    private readonly repositories: Repositories,
    private readonly featureFlagResolver: FeatureFlagResolver,
  ) {}

  @OnEvent(TransferCreated.EVENT_NAME, { async: true })
  @Observability.WithScope(`${TransferCreated.EVENT_NAME}-journal-entry`)
  async handleTransferCreated(event: TransferCreated) {
    if (!this.featureFlagResolver.isEnabled(FeatureFlag.QuickbooksSync)) {
      this.logger.debug('QuickBooks sync is disabled via feature flag');
      return;
    }

    await this.databaseService.withRequestContext(async () => {
      try {
        const transfer = await this.repositories.clientBatchPayment.getOneById(
          event.transferId,
          {
            populate: [
              'clientPayments',
              'clientPayments.invoicePayments.invoice',
            ],
          },
        );
        await this.journalEntryStrategyFactory
          .getStrategy(QuickbooksJournalEntryType.BatchPayment)
          .upsertJournalEntry(transfer);
      } catch (error) {
        this.logger.error(
          `Could not create journal entry for transfer ${event.transferId} - ${error}`,
        );
      }
    });
  }
}
