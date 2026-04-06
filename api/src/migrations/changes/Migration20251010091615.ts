import { Migration } from '@mikro-orm/migrations';
import { QuickbooksAccountQueryGenerator } from '../utils';

const QUICKBOOKS_ACCOUNTS_SEED = [
  {
    key: 'FACTORING_AR',
    name: '11000 Factoring A/R',
    number: '11000',
    type: 'Accounts Receivable',
    subType: 'AccountsReceivable',
    quickbooksId: null,
  },
  {
    key: 'OUTGOING_CASH',
    name: '10050 Bank of America x7554',
    number: '10050',
    type: 'Bank',
    subType: 'Checking',
    quickbooksId: null,
  },
  {
    key: 'INCOMING_CASH',
    name: '10070 Bank of America x7570',
    number: '10070',
    type: 'Bank',
    subType: 'Checking',
    quickbooksId: null,
  },
  {
    key: 'CUSTOMER_CREDIT',
    name: '50000 Customer Credit',
    number: '50000',
    type: 'Expense',
    subType: 'AdvertisingPromotional',
    quickbooksId: null,
  },
  {
    key: 'OTHER_CURRENT_ASSETS',
    name: '11010 Other Current Assets',
    number: '11010',
    type: 'Other Current Asset',
    subType: 'OtherCurrentAssets',
    quickbooksId: null,
  },
  {
    key: 'REVENUE',
    name: '40000 Factoring Revenue',
    number: '40000',
    type: 'Income',
    subType: 'SalesOfProductIncome',
    quickbooksId: null,
  },
  {
    key: 'FEE_REVENUE',
    name: '40020 Fee Revenue',
    number: '40020',
    type: 'Income',
    subType: 'ServiceFeeIncome',
    quickbooksId: null,
  },
  {
    key: 'BAD_DEBT_EXPENSE',
    name: '40070 Bad Debt Expense',
    number: '40070',
    type: 'Other Current Asset',
    subType: 'AllowanceForBadDebts',
    quickbooksId: null,
  },
];

export class Migration20251010091615 extends Migration {
  override async up(): Promise<void> {
    const queryGenerator = new QuickbooksAccountQueryGenerator(this.driver);
    for (const account of QUICKBOOKS_ACCOUNTS_SEED) {
      this.addSql(queryGenerator.addQuickbooksAccount(account));
    }
  }

  override async down(): Promise<void> {
    const queryGenerator = new QuickbooksAccountQueryGenerator(this.driver);
    for (const account of QUICKBOOKS_ACCOUNTS_SEED) {
      this.addSql(queryGenerator.deleteQuickbooksAccount(account.key));
    }
  }
}
