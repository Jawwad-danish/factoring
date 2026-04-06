import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database';
import { BrokerFactoringStatsRepository } from './broker-factoring-stats.repository';
import { BrokerPaymentRepository } from './broker-payment.repository';
import { ClientBatchPaymentRepository } from './client-batch-payment.repository';
import { ClientFactoringAnalyticsRepository } from './client-factoring-analytics.repository';
import { ClientFactoringConfigsRepository } from './client-factoring-configs.repository';
import { ClientPaymentRepository } from './client-payment.repository';
import { InvoiceClientPaymentRepository } from './invoice-client-payment.repository';
import { InvoiceRepository } from './invoice.repository';
import { ReserveRepository } from './reserves.repository';
import { ClientSuccessTeamRepository } from './client-success-team.repository';
import { QuickbooksJournalEntryRepository } from './quickbooks-journal-entry.repository';
import { QuickbooksAccountsRepository } from './quickbooks-accounts.repository';

export interface EntityStorage {
  persist<TEntity extends object>(entity: TEntity | TEntity[]): void;
}

@Injectable()
export class Repositories implements EntityStorage {
  constructor(
    @Inject(DatabaseService)
    readonly databaseService: DatabaseService,
    readonly invoice: InvoiceRepository,
    readonly reserve: ReserveRepository,
    readonly clientBatchPayment: ClientBatchPaymentRepository,
    readonly invoiceClientPayment: InvoiceClientPaymentRepository,
    readonly clientFactoringConfig: ClientFactoringConfigsRepository,
    readonly clientPaymentRepository: ClientPaymentRepository,
    readonly brokerFactoringStats: BrokerFactoringStatsRepository,
    readonly clientFactoringAnalytics: ClientFactoringAnalyticsRepository,
    readonly brokerPayment: BrokerPaymentRepository,
    readonly clientSuccessTeams: ClientSuccessTeamRepository,
    readonly journalEntries: QuickbooksJournalEntryRepository,
    readonly quickbooksAccounts: QuickbooksAccountsRepository,
  ) {}

  persist<TEntity extends object>(entity: TEntity | TEntity[]): void {
    this.databaseService.getMikroORM().em.persist(entity);
  }

  execute(query: string, parameters?: any[]): Promise<any> {
    return this.databaseService
      .getMikroORM()
      .em.execute(query, parameters, 'all');
  }

  getEntityManager() {
    return this.databaseService.getMikroORM().em;
  }

  async flush(): Promise<void> {
    return this.databaseService.getMikroORM().em.flush();
  }

  async persistAndFlush<TEntity extends object>(
    entity: TEntity | TEntity[],
  ): Promise<void> {
    return this.databaseService.getMikroORM().em.persistAndFlush(entity);
  }
}
