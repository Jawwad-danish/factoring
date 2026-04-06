import { DatabaseService } from '@module-database';
import { PaymentOrderEntity } from '@module-persistence/entities';
import { BasicRepository } from '@module-persistence/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentOrderRepository extends BasicRepository<PaymentOrderEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, PaymentOrderEntity);
  }
}
