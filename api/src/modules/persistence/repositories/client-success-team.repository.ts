import { DatabaseService } from '@module-database';
import { ClientSuccessTeamEntity } from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ClientSuccessTeamRepository extends BasicRepository<ClientSuccessTeamEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientSuccessTeamEntity);
  }
}
