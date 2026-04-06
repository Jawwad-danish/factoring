import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum QBAccountKeys {
  Revenue = 'REVENUE',
  FactoringAR = 'FACTORING_AR',
  OutgoingCash = 'OUTGOING_CASH',
  IncomingCash = 'INCOMING_CASH',
  CustomerCredit = 'CUSTOMER_CREDIT',
  OtherCurrentAssets = 'OTHER_CURRENT_ASSETS',
  FeeRevenue = 'FEE_REVENUE',
  BadDebtExpense = 'BAD_DEBT_EXPENSE',
}

@Entity({ tableName: 'quickbooks_accounts' })
export class QuickbooksAccountEntity extends BasicMutableEntity {
  @Index()
  @Enum({
    items: () => QBAccountKeys,
    comment: 'Internal account key',
    unique: true,
  })
  key: QBAccountKeys;

  @Property({ type: 'text', nullable: true, comment: 'Account name' })
  name: string | null;

  @Property({ type: 'text', nullable: true, comment: 'Account number' })
  number: string | null;

  @Property({ type: 'text', nullable: true, comment: 'Account type' })
  type: string | null;

  @Property({ type: 'text', nullable: true, comment: 'Account sub-type' })
  subType: string | null;

  @Index()
  @Property({
    type: 'text',
    nullable: true,
    comment: 'Quickbooks API account id',
    default: null,
  })
  quickbooksId: string | null;
}
