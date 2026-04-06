import { DatabaseService } from '@module-database';
import { ReserveClientPaymentEntity } from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ReserveClientPaymentRepository extends BasicRepository<ReserveClientPaymentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ReserveClientPaymentEntity);
  }
}
