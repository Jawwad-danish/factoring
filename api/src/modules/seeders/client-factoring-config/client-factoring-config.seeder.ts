import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  ClientSuccessTeamRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';

import {
  EntityStubs,
  PartialClientFactoringConfigsEntity,
} from '../../persistence/test';
import { UserSeeder } from '../users';

@Injectable()
export class ClientFactoringConfigsSeeder {
  private logger: Logger = new Logger(ClientFactoringConfigsSeeder.name);

  constructor(
    private readonly repository: ClientFactoringConfigsRepository,
    private readonly clientSuccessTeamRepository: ClientSuccessTeamRepository,
    private readonly userSeder: UserSeeder,
  ) {}

  async create(
    data?: PartialClientFactoringConfigsEntity,
  ): Promise<ClientFactoringConfigsEntity> {
    const clientFactoringConfigEntity = await this.build(data);
    try {
      return await this.repository.persistAndFlush(clientFactoringConfigEntity);
    } catch (error) {
      this.logger.error(`Could not seed client factoring config`, error);
      throw error;
    }
  }

  private async build(
    data?: PartialClientFactoringConfigsEntity,
  ): Promise<ClientFactoringConfigsEntity> {
    const entity = EntityStubs.buildClientFactoringConfig(data);
    if (!data?.user) {
      const user = await this.userSeder.create();
      entity.user = user;
    }
    entity.clientSuccessTeam = await this.getClientSuccessTeam(data);
    Object.assign(entity, data);
    return Promise.resolve(entity);
  }

  private async getClientSuccessTeam(
    data?: PartialClientFactoringConfigsEntity,
  ) {
    if (data?.clientSuccessTeam) {
      return data.clientSuccessTeam;
    }
    const clientSuccessTeams = await this.clientSuccessTeamRepository.findAll();
    return clientSuccessTeams[0][0];
  }
}
