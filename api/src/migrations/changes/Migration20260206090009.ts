import { Migration } from '@mikro-orm/migrations';

export class Migration20260206090009 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "report_documents" drop constraint if exists "report_documents_report_name_check";`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_report_name_check" check("report_name" in ('CLIENT_TOTAL_RESERVE', 'APPROVED_AGING', 'PORTFOLIO_RESERVE', 'CLIENT_LIST', 'CLIENT_ANNUAL', 'SALESFORCE_RECONCILIATION', 'BATCH', 'CLIENT_ACCOUNT_SUMMARY', 'BROKER_AGING', 'LOAN_TAPE', 'DETAILED_AGING', 'BROKER_PAYMENT', 'CLIENT_TRENDS', 'CLIENT_SUMMARY', 'PORTFOLIO', 'ROLL_FORWARD', 'NET_FUNDS_EMPLOYED', 'CLIENT_AGING', 'RECONCILIATION'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "report_documents" drop constraint if exists "report_documents_report_name_check";`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_report_name_check" check("report_name" in ('CLIENT_TOTAL_RESERVE', 'APPROVED_AGING', 'PORTFOLIO_RESERVE', 'CLIENT_LIST', 'CLIENT_ANNUAL', 'SALESFORCE_RECONCILIATION', 'BATCH', 'CLIENT_ACCOUNT_SUMMARY', 'BROKER_AGING', 'LOAN_TAPE', 'DETAILED_AGING', 'BROKER_PAYMENT', 'CLIENT_TRENDS', 'CLIENT_SUMMARY', 'PORTFOLIO', 'ROLL_FORWARD', 'RECONCILIATION', 'NET_FUNDS_EMPLOYED'));`,
    );
  }
}
