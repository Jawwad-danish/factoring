import { Injectable } from '@nestjs/common';

import { environment } from '@core/environment';
import { Client, ClientFactoringConfigMapper } from '@module-clients/data';
import { buildStubClient } from '@module-clients/test';
import { UserMapper } from '@module-common';
import { UserRepository } from '@module-persistence/repositories';
import { PartialClientFactoringConfigsEntity } from '@module-persistence/test';
import { ClientFactoringConfigsSeeder } from './client-factoring-config.seeder';
import { EntityNotFoundError } from '@core/errors';

export type PartialClient = {
  client?: Omit<Client, 'factoringConfig'>;
  factoringConfig?: PartialClientFactoringConfigsEntity;
};

@Injectable()
export class ClientSeeder {
  constructor(
    private readonly clientFactoringConfigSeeder: ClientFactoringConfigsSeeder,
    private readonly clientFactoringConfigMapper: ClientFactoringConfigMapper,
    private readonly userMapper: UserMapper,
    private readonly userRepository: UserRepository,
  ) {}

  async create(data?: PartialClient): Promise<Client> {
    const client = buildStubClient(data?.client);
    const clientFactoringConfig = await this.clientFactoringConfigSeeder.create(
      {
        clientId: client.id,
        ...data?.factoringConfig,
      },
    );
    client.factoringConfig =
      await this.clientFactoringConfigMapper.entityToModel(
        clientFactoringConfig,
      );
    if (!data?.client?.createdBy) {
      const systemUser = await this.userRepository.findByEmail(
        environment.core.systemEmail(),
      );
      if (!systemUser) {
        throw new EntityNotFoundError(
          'System user could not be found to seed the database with client and factoring config',
        );
      }
      client.createdBy = await this.userMapper.entityToModel(systemUser);
      client.updatedBy = await this.userMapper.entityToModel(systemUser);
    }
    return client;
  }
}
