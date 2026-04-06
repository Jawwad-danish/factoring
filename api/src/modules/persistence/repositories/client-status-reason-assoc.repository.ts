import { DatabaseService } from '@module-database';
import { ClientStatusReasonAssocEntity } from '@module-persistence/entities';
import { Injectable, Inject } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientStatusReasonAssocRepository extends BasicRepository<ClientStatusReasonAssocEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientStatusReasonAssocEntity);
  }
}
