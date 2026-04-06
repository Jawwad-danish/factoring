import { Repositories } from '@module-persistence/repositories';
import { Client } from 'pg';
import { ClientReservesStrategy } from './client-reserves-strategy';
import { ClientFieldsStrategy } from './clients-fields-strategy';
import { ClientInvoicesCountStrategy } from './clients-invoices-count-strategy';

export class ClientParity {
  constructor(readonly v1Client: Client, readonly repositories: Repositories) {}

  async run(): Promise<Record<string, object>> {
    const clientInvoicesCountResult = await new ClientInvoicesCountStrategy(
      this.v1Client,
      this.repositories,
      'clients-invoices-count',
    ).run();
    const clientReservesResult = await new ClientReservesStrategy(
      this.v1Client,
      this.repositories,
      'clients-reserves',
    ).run();
    const clientFieldsResult = await new ClientFieldsStrategy(
      this.v1Client,
      this.repositories,
      'clients-fields',
    ).run();
    return Object.assign(
      {},
      clientFieldsResult,
      clientReservesResult,
      clientInvoicesCountResult,
    );
  }
}
