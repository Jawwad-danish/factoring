import { Client } from '@module-clients/data';
import {
  ClientSeeder,
  ClientSuccessTeamsSeeder,
  PartialClient,
} from '@module-seeders';
import { ITAppManager } from './it-app-manager';
import { Broker } from '@module-brokers/data';
import { buildStubBroker } from '@module-brokers/test';

export class ITDataManager {
  clients: Client[] = [];
  brokers: Broker[] = [];

  constructor(private readonly appManager: ITAppManager) {}

  async setup() {
    await this.appManager.runTransactionally(
      async () => this.createClientSuccesTeam,
    );
  }

  async createClient(data?: PartialClient): Promise<Client> {
    const clientSeeder = this.appManager.app.get(ClientSeeder);
    const client = await this.appManager.runTransactionally(() =>
      clientSeeder.create(data),
    );
    this.clients.push(client);
    return client;
  }

  private async createClientSuccesTeam() {
    const seeder = this.appManager.app.get(ClientSuccessTeamsSeeder);
    await seeder.create({
      name: `Team 101 - Integration Testing ${crypto.randomUUID()}`,
    });
  }

  createBroker(data?: Partial<Broker>): Broker {
    const broker = buildStubBroker(data);
    this.brokers.push(broker);
    return broker;
  }
}
