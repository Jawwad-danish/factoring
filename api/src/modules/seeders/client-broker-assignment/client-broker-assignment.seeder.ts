import {
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentStatus,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { UUID } from '@core/uuid';
import { EntityStubs } from '@module-persistence/test';

@Injectable()
export class ClientBrokerAssignmentSeeder {
  private logger: Logger = new Logger(ClientBrokerAssignmentSeeder.name);

  constructor(private readonly repository: ClientBrokerAssignmentRepository) {}

  async create(
    data?: Partial<ClientBrokerAssignmentEntity>,
  ): Promise<ClientBrokerAssignmentEntity> {
    const clientFactoringConfigsRepository = this.build(data);
    try {
      await this.repository.persistAndFlush(clientFactoringConfigsRepository);
    } catch (error) {
      this.logger.error(
        `Could not save client factoring config ${clientFactoringConfigsRepository.id}`,
        error,
      );
    }
    return clientFactoringConfigsRepository;
  }

  private build(
    data?: Partial<ClientBrokerAssignmentEntity>,
  ): ClientBrokerAssignmentEntity {
    const userEntity = EntityStubs.buildStubUser();
    const entity = new ClientBrokerAssignmentEntity();
    entity.clientId = UUID.get();
    entity.brokerId = UUID.get();
    entity.status = ClientBrokerAssignmentStatus.Verified;
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }
}
