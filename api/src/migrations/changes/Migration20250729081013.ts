import { Migration } from '@mikro-orm/migrations';

export class Migration20250729081013 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "employees" drop constraint "employees_user_id_foreign";`,
    );

    this.addSql(
      `alter table "report_documents" drop constraint if exists "report_documents_report_name_check";`,
    );

    this.addSql(
      `alter table "employees" add constraint "employees_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_report_name_check" check("report_name" in ('CLIENT_TOTAL_RESERVE', 'APPROVED_AGING', 'PORTFOLIO_RESERVE', 'CLIENT_LIST', 'BATCH'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "employees" drop constraint "employees_user_id_foreign";`,
    );

    this.addSql(
      `alter table "report_documents" drop constraint if exists "report_documents_report_name_check";`,
    );

    this.addSql(
      `alter table "employees" add constraint "employees_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete no action;`,
    );

    this.addSql(
      `alter table "report_documents" add constraint "report_documents_report_name_check" check("report_name" in ('CLIENT_TOTAL_RESERVE', 'APPROVED_AGING', 'PORTFOLIO_RESERVE', 'CLIENT_LIST'));`,
    );
  }
}
