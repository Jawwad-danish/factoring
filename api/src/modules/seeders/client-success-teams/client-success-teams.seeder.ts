import { ClientSuccessTeamEntity } from '@module-persistence/entities';
import { ClientSuccessTeamRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';

import { EntityStubs } from '../../persistence/test';

@Injectable()
export class ClientSuccessTeamsSeeder {
  private logger: Logger = new Logger(ClientSuccessTeamsSeeder.name);

  constructor(private readonly repository: ClientSuccessTeamRepository) {}

  async create(
    data?: Partial<ClientSuccessTeamEntity>,
  ): Promise<ClientSuccessTeamEntity> {
    const clientSuccessTeamEntity = EntityStubs.buildClientSuccessTeam(data);
    try {
      await this.repository.persistAndFlush(clientSuccessTeamEntity);
      return clientSuccessTeamEntity;
    } catch (error) {
      this.logger.error(`Could not seed client success team`, error);
      throw error;
    }
  }
}
