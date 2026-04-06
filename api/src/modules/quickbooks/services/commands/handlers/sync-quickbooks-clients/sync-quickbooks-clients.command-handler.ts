import { Customer } from '@balancer-team/quickbooks/dist/schemas';
import { CrossCuttingConcerns } from '@core/util';
import { ClientApi, LightweightClient } from '@module-clients';
import { BasicCommandHandler } from '@module-cqrs';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringConfigsRepository,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { QuickbooksApi } from '../../../../api';
import { SyncQuickbooksClientsCommand } from '../../sync-quickbooks-clients.command';

@Injectable()
@CommandHandler(SyncQuickbooksClientsCommand)
export class SyncQuickbooksClientsCommandHandler
  implements BasicCommandHandler<SyncQuickbooksClientsCommand>
{
  private logger = new Logger(SyncQuickbooksClientsCommandHandler.name);

  constructor(
    private readonly quickbooksApi: QuickbooksApi,
    private readonly clientApi: ClientApi,
    private readonly factoringConfigRepository: ClientFactoringConfigsRepository,
  ) {}

  @CrossCuttingConcerns({
    logging: () => {
      return {
        message: 'Syncing clients to Quickbooks',
      };
    },
    observability: {
      tag: ['quickbooks', 'sync-clients'],
    },
  })
  async execute(): Promise<void> {
    const clients = await this.clientApi.getAllClients();
    const clientIds = clients.map((client) => client.id);
    const factoringConfigs =
      await this.factoringConfigRepository.findByClientIds(clientIds);

    const clientsMap = this.buildClientsMap(clients);

    for (const factoringConfig of factoringConfigs) {
      const client = clientsMap.get(factoringConfig.clientId);
      if (!client) {
        this.logger.warn(
          `Client not found for factoring config ${factoringConfig.clientId}`,
        );
        continue;
      }

      await this.syncClient(factoringConfig, client);
    }
  }

  private buildClientsMap(
    clients: LightweightClient[],
  ): Map<string, LightweightClient> {
    return new Map(clients.map((client) => [client.id, client]));
  }

  private async syncClient(
    factoringConfig: ClientFactoringConfigsEntity,
    client: LightweightClient,
  ): Promise<void> {
    if (!factoringConfig.quickbooksId) {
      await this.createOrLinkQuickbooksCustomer(factoringConfig, client);
    } else {
      await this.updateQuickbooksCustomerIfNeeded(factoringConfig, client);
    }
  }

  private async createOrLinkQuickbooksCustomer(
    factoringConfig: ClientFactoringConfigsEntity,
    client: LightweightClient,
  ): Promise<void> {
    const existingCustomer = await this.quickbooksApi.getCustomerByName(
      client.name,
    );

    if (existingCustomer) {
      this.linkExistingCustomer(factoringConfig, existingCustomer);
      return;
    }

    await this.createNewCustomer(factoringConfig, client);
  }

  private linkExistingCustomer(
    factoringConfig: ClientFactoringConfigsEntity,
    customer: Customer,
  ): void {
    factoringConfig.quickbooksId = customer.Id;
    factoringConfig.quickbooksName = customer.DisplayName;
  }

  private async createNewCustomer(
    factoringConfig: ClientFactoringConfigsEntity,
    client: LightweightClient,
  ): Promise<void> {
    this.logger.log(`Creating Quickbooks customer for ${client.name}`);
    const newCustomer = await this.quickbooksApi.createCustomer({
      DisplayName: client.name,
    });
    this.linkExistingCustomer(factoringConfig, newCustomer);
  }

  private async updateQuickbooksCustomerIfNeeded(
    factoringConfig: ClientFactoringConfigsEntity,
    client: LightweightClient,
  ): Promise<void> {
    if (this.isNameInSync(factoringConfig, client)) {
      return;
    }

    if (!factoringConfig.quickbooksId) {
      this.logger.warn(
        `Cannot update: Quickbooks ID missing for client ${factoringConfig.clientId}`,
      );
      return;
    }

    const quickbooksCustomer = await this.quickbooksApi.getCustomerById(
      factoringConfig.quickbooksId,
    );

    if (!quickbooksCustomer) {
      this.logger.warn(
        `Quickbooks customer ${factoringConfig.quickbooksId} not found`,
      );
      return;
    }

    const uniqueName = await this.resolveUniqueCustomerName(
      client.name,
      client.mc,
    );

    try {
      await this.updateCustomerName(
        factoringConfig,
        quickbooksCustomer,
        uniqueName,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Quickbooks customer name ${factoringConfig.quickbooksId}`,
        error,
      );
    }
  }

  private async resolveUniqueCustomerName(
    clientName: string,
    clientMc: string,
  ): Promise<string> {
    if (await this.isCustomerNameAvailable(clientName)) {
      return clientName;
    }

    const nameWithMc = `${clientName}-${clientMc.slice(-3)}`;
    if (await this.isCustomerNameAvailable(nameWithMc)) {
      return nameWithMc;
    }

    return `${clientName}-${Math.floor(Math.random() * 1000)}`;
  }

  private async isCustomerNameAvailable(name: string): Promise<boolean> {
    const existing = await this.quickbooksApi.getCustomerByName(name);
    return !existing;
  }

  private isNameInSync(
    factoringConfig: ClientFactoringConfigsEntity,
    client: LightweightClient,
  ): boolean {
    return client.name === factoringConfig.quickbooksName;
  }

  private async updateCustomerName(
    factoringConfig: ClientFactoringConfigsEntity,
    quickbooksCustomer: Customer,
    newName: string,
  ): Promise<void> {
    this.logger.log(
      `Updating Quickbooks customer from "${factoringConfig.quickbooksName}" to "${newName}"`,
    );

    const updatedCustomer = await this.quickbooksApi.updateCustomer({
      Id: factoringConfig.quickbooksId!,
      SyncToken: quickbooksCustomer.SyncToken,
      DisplayName: newName,
    });

    factoringConfig.quickbooksName = updatedCustomer.DisplayName;
  }
}
