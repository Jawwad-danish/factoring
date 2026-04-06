import { EntityNotFoundError } from '@core/errors';
import { BasicQueryHandler } from '@module-cqrs';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { QueryHandler } from '@nestjs/cqrs';
import { ClientApi } from '../../../../api';
import { Client, ClientFactoringConfigMapper } from '../../../../data';
import { FindClientsOptions } from '../../find-clients-options';
import { FindClientsByIds } from '../../find-clients-by-ids.query';

@QueryHandler(FindClientsByIds)
export class FindClientsByIdsQueryHandler
  implements BasicQueryHandler<FindClientsByIds>
{
  private logger = new Logger(FindClientsByIdsQueryHandler.name);

  constructor(
    private readonly clientApi: ClientApi,
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly clientFactoringConfigMapper: ClientFactoringConfigMapper,
  ) {}

  async execute({ ids, options }: FindClientsByIds): Promise<Client[]> {
    const clients = await this.clientApi.findByIds(ids);
    if (options?.includeBankAccounts) {
      await this.loadBankAccounts(clients);
    }
    await this.loadFactoringConfigs(clients, options);
    return clients;
  }

  private async loadBankAccounts(clients: Client[]): Promise<void> {
    for (const client of clients) {
      const bankAccounts = await this.clientApi.getBankAccountsByClientId(
        client.id,
      );
      client.bankAccounts = bankAccounts;
    }
  }

  private async loadFactoringConfigs(
    clients: Client[],
    options?: FindClientsOptions,
  ): Promise<void> {
    const clientIds = clients.map((client) => client.id);
    const configs = await this.clientFactoringConfigRepository.findByClientIds(
      clientIds,
      {
        history: options?.includeHistory || false,
        audit: options?.includeAudit || false,
        user: options?.includeUser || false,
      },
    );

    for (const client of clients) {
      const config = configs.find((config) => config.clientId === client.id);
      if (!config) {
        this.logger.error('Could not find client factoring config', {
          clientId: client.id,
        });
        throw EntityNotFoundError.byId(client.id, 'client factoring config');
      }

      client.factoringConfig =
        await this.clientFactoringConfigMapper.entityToModel(config);
      client.email = config.user?.email || '';
    }
  }
}
