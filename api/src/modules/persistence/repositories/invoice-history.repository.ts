import { DatabaseService } from '@module-database';
import { BasicRepository } from '@module-persistence/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { InvoiceHistoryEntity } from '../history';

@Injectable()
export class InvoiceHistoryRepository extends BasicRepository<InvoiceHistoryEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, InvoiceHistoryEntity);
  }
}
