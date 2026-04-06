import { DatabaseService } from '@module-database';
import { InvoiceClientPaymentEntity } from '@module-persistence/entities';
import { BasicRepository } from '@module-persistence/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceClientPaymentRepository extends BasicRepository<InvoiceClientPaymentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, InvoiceClientPaymentEntity);
  }

  async findOneByInvoiceId(
    invoiceId: string,
  ): Promise<InvoiceClientPaymentEntity | null> {
    return await this.repository.findOne({
      invoice: {
        id: invoiceId,
      },
    });
  }
}
