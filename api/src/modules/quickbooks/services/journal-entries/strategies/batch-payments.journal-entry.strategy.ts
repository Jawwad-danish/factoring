import { getDateInBusinessTimezone } from '@core/date-time';
import { Collection } from '@mikro-orm/core';
import { ExpediteConfigurer } from '@module-common';
import { Transactional } from '@module-database';
import { QuickbooksJournalEntryType, Repositories } from '@module-persistence';
import {
  ClientBatchPaymentEntity,
  PaymentType,
  QBAccountKeys,
  QuickbooksJournalEntryEntity,
  QuickbooksJournalEntryLineEntity,
  QuickbooksJournalPostingType,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { BaseJournalEntryStrategy } from './base.journal-entry.strategy';
import { IJournalEntryStrategy } from './ijournal-entry.strategy';

@Injectable()
export class BatchPaymentsJournalEntryStrategy
  extends BaseJournalEntryStrategy<ClientBatchPaymentEntity>
  implements IJournalEntryStrategy<ClientBatchPaymentEntity>
{
  constructor(
    repositories: Repositories,
    private readonly expediteConfigurer: ExpediteConfigurer,
  ) {
    super(repositories);
  }
  getEntryType(): QuickbooksJournalEntryType {
    return QuickbooksJournalEntryType.BatchPayment;
  }

  @Transactional('recompute-batch-payment-journal-entry')
  async upsertJournalEntry(
    batch: ClientBatchPaymentEntity,
  ): Promise<QuickbooksJournalEntryEntity> {
    const isExpedited = batch.type === PaymentType.WIRE;
    const businessDay = getDateInBusinessTimezone(batch.createdAt);
    const formattedDate = businessDay.format('MMDDYY-hh:mmA');
    const docName = `CP-${isExpedited ? 'WT' : 'ACH'}-${formattedDate}`;

    let journalEntry = await this.repositories.journalEntries.findOne({
      businessDay: businessDay.format('YYYY-MM-DD'),
      type: QuickbooksJournalEntryType.BatchPayment,
      docName,
    });

    if (!journalEntry) {
      journalEntry = this.createNewJournalEntry(batch.createdAt, docName);
    }

    journalEntry.lines = new Collection<QuickbooksJournalEntryLineEntity>(
      journalEntry,
    );

    let totalOutgoingCash = new Big(0);

    const accounts = await this.repositories.quickbooksAccounts.getByKeys([
      QBAccountKeys.FactoringAR,
      QBAccountKeys.Revenue,
      QBAccountKeys.FeeRevenue,
      QBAccountKeys.OutgoingCash,
    ]);

    const arAccount = accounts.get(QBAccountKeys.FactoringAR)!;

    const revenueAccount = accounts.get(QBAccountKeys.Revenue)!;

    const feeRevenueAccount = accounts.get(QBAccountKeys.FeeRevenue)!;

    const outgoingCashAccount = accounts.get(QBAccountKeys.OutgoingCash)!;

    for (const payment of batch.clientPayments) {
      let approvedFactorFeeTotal = new Big(0);
      let approvedAmountAfterDeductionTotal = new Big(0);

      for (const invoicePayment of payment.invoicePayments) {
        const invoice = invoicePayment.invoice;
        approvedFactorFeeTotal = approvedFactorFeeTotal.plus(
          invoice.approvedFactorFee,
        );
        approvedAmountAfterDeductionTotal =
          approvedAmountAfterDeductionTotal.plus(
            invoice.accountsReceivableValue,
          );
      }

      const revLine = new QuickbooksJournalEntryLineEntity();
      revLine.type = QuickbooksJournalPostingType.Credit;
      revLine.account = revenueAccount;
      revLine.amount = approvedFactorFeeTotal;
      revLine.clientPayment = payment;
      revLine.clientId = payment.clientId;
      revLine.note = `Approved factor fees for client ${payment.clientId}`;
      journalEntry.lines.add(revLine);

      const arLine = new QuickbooksJournalEntryLineEntity();
      arLine.type = QuickbooksJournalPostingType.Debit;
      arLine.account = arAccount;
      arLine.amount = approvedAmountAfterDeductionTotal;
      arLine.clientPayment = payment;
      arLine.clientId = payment.clientId;
      arLine.note = `Approved amount (after deduction) for client ${payment.clientId}`;
      journalEntry.lines.add(arLine);

      totalOutgoingCash = totalOutgoingCash.add(
        approvedAmountAfterDeductionTotal.minus(approvedFactorFeeTotal),
      );
    }

    if (isExpedited) {
      const transferFee = this.expediteConfigurer.expediteFee(); // TODO: save transfer fee on batch payment entity
      const feeRevenueLine = new QuickbooksJournalEntryLineEntity();
      feeRevenueLine.type = QuickbooksJournalPostingType.Credit;
      feeRevenueLine.account = feeRevenueAccount;
      feeRevenueLine.amount = transferFee;
      feeRevenueLine.batchPayment = batch;
      feeRevenueLine.clientId = batch.clientPayments[0].clientId;
      feeRevenueLine.note = `Transfer fee for batch payment ${batch.id}`;
      totalOutgoingCash = totalOutgoingCash.minus(transferFee);
      journalEntry.lines.add(feeRevenueLine);
    }

    if (totalOutgoingCash.gt(0)) {
      const cashLine = new QuickbooksJournalEntryLineEntity();
      cashLine.type = QuickbooksJournalPostingType.Credit;
      cashLine.account = outgoingCashAccount;
      cashLine.amount = totalOutgoingCash;
      cashLine.batchPayment = batch;
      cashLine.note = `Outgoing cash for batch payment ${batch.id}`;
      journalEntry.lines.add(cashLine);
    }

    this.repositories.journalEntries.persist(journalEntry);
    return journalEntry;
  }
}
