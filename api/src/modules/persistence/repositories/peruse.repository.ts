import { PeruseJobEntity } from '../entities';
import { Inject, Injectable } from '@nestjs/common';

import { DatabaseService } from '@module-database';
import { BasicRepository } from './basic-repository';

@Injectable()
export class PeruseRepository extends BasicRepository<PeruseJobEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, PeruseJobEntity);
  }
}
