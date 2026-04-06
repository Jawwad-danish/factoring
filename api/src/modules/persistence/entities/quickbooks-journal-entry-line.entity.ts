import {
  Cascade,
  Entity,
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  Property,
} from '@mikro-orm/core';
import Big from 'big.js';
import { Type } from 'class-transformer';
import { TransformFromBig, TransformToBig } from '../../../core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { BrokerPaymentEntity } from './broker-payment.entity';
import { ClientBatchPaymentEntity } from './client-batch-payment.entity';
import { ClientPaymentEntity } from './client-payment.entity';
import { InvoiceEntity } from './invoice.entity';
import { QuickbooksAccountEntity } from './quickbooks-account.entity';
import { QuickbooksJournalEntryEntity } from './quickbooks-journal-entry.entity';
import { ReserveEntity } from './reserve.entity';

export enum QuickbooksJournalPostingType {
  Debit = 'debit',
  Credit = 'credit',
}

@Entity({ tableName: 'quickbooks_journal_entry_lines' })
export class QuickbooksJournalEntryLineEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne(() => QuickbooksAccountEntity, { nullable: false })
  account: QuickbooksAccountEntity;

  @Enum({
    items: () => QuickbooksJournalPostingType,
    nullable: false,
  })
  type: QuickbooksJournalPostingType;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  amount: Big = Big(0);

  @Index()
  @ManyToOne({
    entity: () => QuickbooksJournalEntryEntity,
    nullable: false,
    cascade: [Cascade.ALL],
    strategy: LoadStrategy.SELECT_IN,
  })
  journalEntry: QuickbooksJournalEntryEntity;

  @Index()
  @Property({
    type: 'uuid',
    nullable: true,
  })
  clientId: string | null;

  @Property({ type: 'text', nullable: false, unique: false, default: '' })
  note: string;

  @ManyToOne(() => ClientPaymentEntity, { nullable: true })
  clientPayment?: ClientPaymentEntity;

  @ManyToOne(() => BrokerPaymentEntity, { nullable: true })
  brokerPayment?: BrokerPaymentEntity;

  @ManyToOne(() => ClientBatchPaymentEntity, { nullable: true })
  batchPayment?: ClientBatchPaymentEntity;

  @ManyToOne(() => ReserveEntity, { nullable: true })
  reserve?: ReserveEntity;

  @ManyToOne(() => InvoiceEntity, { nullable: true })
  invoice?: InvoiceEntity;
}
