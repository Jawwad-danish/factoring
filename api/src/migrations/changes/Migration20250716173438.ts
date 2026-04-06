import { Migration } from '@mikro-orm/migrations';

export class Migration20250716173438 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "pending_buyouts_batch" drop constraint "pending_buyouts_batch_factoring_company_id_foreign";`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" alter column "factoring_company_id" drop default;`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" alter column "factoring_company_id" type uuid using ("factoring_company_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" alter column "factoring_company_id" drop not null;`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" add constraint "pending_buyouts_batch_factoring_company_id_foreign" foreign key ("factoring_company_id") references "factoring_companies" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "pending_buyouts_batch" drop constraint "pending_buyouts_batch_factoring_company_id_foreign";`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" alter column "factoring_company_id" drop default;`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" alter column "factoring_company_id" type uuid using ("factoring_company_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" alter column "factoring_company_id" set not null;`,
    );
    this.addSql(
      `alter table "pending_buyouts_batch" add constraint "pending_buyouts_batch_factoring_company_id_foreign" foreign key ("factoring_company_id") references "factoring_companies" ("id") on update cascade on delete no action;`,
    );
  }
}
