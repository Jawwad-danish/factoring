export enum QuickbooksJournalEntryStatus {
  Pending = 'pending',
  Synced = 'synced',
  Failed = 'failed',
}

export enum QuickbooksJournalEntryType {
  BatchPayment = 'batch_payment',
  Reserve = 'reserve',
  BrokerPayment = 'broker_payment',
}

export enum QuickbooksJournalPostingType {
  Debit = 'debit',
  Credit = 'credit',
}
