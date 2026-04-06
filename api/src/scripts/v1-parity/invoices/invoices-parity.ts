import { Repositories } from '@module-persistence/repositories';
import { Client } from 'pg';
import { InvoicesFieldsStrategy } from './invoices-fields-strategy';
import { InvoicesBuyoutsStrategy } from './invoices-buyouts-strategy';

export class InvoiceParity {
  constructor(readonly v1Client: Client, readonly repositories: Repositories) {}

  async run(): Promise<Record<string, object>> {
    const invoices = await new InvoicesFieldsStrategy(
      this.v1Client,
      this.repositories,
      'invoices-fields',
    ).run();
    const invoicesBuyouts = await new InvoicesBuyoutsStrategy(
      this.v1Client,
      this.repositories,
      'invoices-buyouts-clients',
    ).run();
    return Object.assign({}, invoices, invoicesBuyouts);
  }
}
