import { DatabaseService } from '@module-database';
import { Inject, Injectable } from '@nestjs/common';
import { ReserveBrokerPaymentEntity } from '@module-persistence/entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ReserveBrokerPaymentRepository extends BasicRepository<ReserveBrokerPaymentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ReserveBrokerPaymentEntity);
  }

  findByBrokerPaymentId(id: string) {
    return this.repository.findOne(
      {
        brokerPayment: {
          id,
        },
      },
      {
        populate: ['reserve'],
      },
    );
  }
}
