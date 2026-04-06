import { Migration } from '@mikro-orm/migrations';

export class Migration20250703075836 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "report_documents" drop constraint if exists "report_documents_report_name_check";`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_report_name_check" check("report_name" in ('CLIENT_TOTAL_RESERVE', 'APPROVED_AGING', 'PORTFOLIO_RESERVE'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "report_documents" drop constraint if exists "report_documents_report_name_check";`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_report_name_check" check("report_name" in ('CLIENT_TOTAL_RESERVE', 'APPROVED_AGING'));`,
    );
  }
}
