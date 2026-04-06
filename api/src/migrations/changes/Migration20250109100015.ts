import { Migration } from '@mikro-orm/migrations';

export class Migration20250109100015 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "reserves" drop constraint if exists "reserves_reason_check";',
    );
    this.addSql(
      'alter table "reserves" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"reserves\" add constraint \"reserves_reason_check\" check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'chargeback removed', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment', 'buyout fee', 'reserve (entry)', 'reserve (entry) removed'));",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "reserves" drop constraint if exists "reserves_reason_check";',
    );
    this.addSql(
      'alter table "reserves" alter column "reason" type text using ("reason"::text);',
    );
    this.addSql(
      "alter table \"reserves\" add constraint \"reserves_reason_check\" check (\"reason\" in ('fee', 'fee removed', 'overpay', 'shortpay', 'non-factored payment', 'non-factored payment removed', 'nonpayment', 'payment removed', 'payment edit increase', 'payment edit decrease', 'chargeback', 'overadvance', 'overadvance removed', 'client credit', 'client credit removed', 'client debit', 'release of funds', 'release of funds removed', 'release to 3rd party', 'release to 3rd party removed', 'direct payment by client', 'direct payment by client removed', 'broker claim', 'broker claim removed', 'write off', 'write off removed', 'balance transfer from', 'balance transfer from (positive)', 'balance transfer to', 'balance transfer to (positive)', 'additional payment', 'buyout fee', 'reserve (entry)', 'reserve (entry) removed'));",
    );
  }
}
