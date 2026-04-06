import { Injectable, Inject } from '@nestjs/common';
import { BasicRepository } from './basic-repository';
import { ClientBrokerAssignmentAssocEntity } from '@module-persistence/entities';
import { DatabaseService } from '@module-database';

@Injectable()
export class ClientBrokerAssignmentAssocRepository extends BasicRepository<ClientBrokerAssignmentAssocEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientBrokerAssignmentAssocEntity);
  }
}
