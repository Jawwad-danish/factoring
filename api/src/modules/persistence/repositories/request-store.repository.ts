import { DatabaseService } from '@module-database';
import { RequestStorageEntity } from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class RequestStorageRepository extends BasicRepository<RequestStorageEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, RequestStorageEntity);
  }
}
