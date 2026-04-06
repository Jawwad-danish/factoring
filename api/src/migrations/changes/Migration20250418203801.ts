import { Migration } from '@mikro-orm/migrations';

export class Migration20250418203801 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'ALTER TABLE public.client_payment_plan_assoc ALTER COLUMN note TYPE text USING note::text',
    );
    this.addSql(
      'ALTER TABLE public.client_payment_plan_assoc ALTER COLUMN payment_plan TYPE text USING payment_plan::text;',
    );
    this.addSql(
      'ALTER TABLE public.client_factoring_configs ALTER COLUMN payment_plan TYPE text USING payment_plan::text;',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'ALTER TABLE public.client_payment_plan_assoc ALTER COLUMN note TYPE varchar(255) USING note::varchar(255);',
    );
    this.addSql(
      'ALTER TABLE public.client_payment_plan_assoc ALTER COLUMN payment_plan TYPE varchar(255) USING payment_plan::varchar(255);',
    );
    this.addSql(
      'ALTER TABLE public.client_factoring_configs ALTER COLUMN payment_plan TYPE varchar(255) USING payment_plan::varchar(255);',
    );
  }
}
