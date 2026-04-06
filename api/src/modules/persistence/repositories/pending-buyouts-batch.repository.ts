import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { PendingBuyoutsBatchEntity } from '../entities/pending-buyouts-batch.entity';
import { BasicRepository } from './basic-repository';

@Injectable()
export class PendingBuyoutsBatchRepository extends BasicRepository<PendingBuyoutsBatchEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, PendingBuyoutsBatchEntity);
  }
}
