import { Migration } from '@mikro-orm/migrations';

export class Migration20240213081905 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS invoices_load_number_gin_index ON public.invoices USING gin (load_number COLLATE pg_catalog."default" gin_trgm_ops) TABLESPACE pg_default;`,
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX invoices_load_number_gin_index;`);
  }
}
