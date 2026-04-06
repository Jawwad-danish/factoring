import { DatabaseService } from '@module-database';
import {
  BrokerPaymentEntity,
  RecordStatus,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class BrokerPaymentRepository extends BasicRepository<BrokerPaymentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, BrokerPaymentEntity);
  }

  async getByInvoiceId(invoiceId: string): Promise<BrokerPaymentEntity[]> {
    return this.repository.find(
      {
        invoice: {
          id: invoiceId,
        },
        recordStatus: RecordStatus.Active,
      },
      { orderBy: { createdAt: 'asc' } },
    );
  }
  async getAllByClientAndBrokerId(
    clientId: string,
    brokerId: string,
  ): Promise<BrokerPaymentEntity[]> {
    return this.repository.find(
      {
        invoice: {
          clientId: clientId,
          brokerId: brokerId,
        },
        recordStatus: RecordStatus.Active,
      },
      { orderBy: { createdAt: 'asc' } },
    );
  }
}
