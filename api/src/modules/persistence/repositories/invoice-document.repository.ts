import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { InvoiceDocumentEntity, InvoiceDocumentType } from '../entities';
import { BasicRepository } from './basic-repository';

@Injectable()
export class InvoiceDocumentRepository extends BasicRepository<InvoiceDocumentEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, InvoiceDocumentEntity);
  }

  async findOneById(id: string): Promise<InvoiceDocumentEntity | null> {
    return this.repository.findOne(
      {
        id: id,
      },
      { populate: ['invoice'] },
    );
  }

  async findGenerated(
    invoiceId: string,
  ): Promise<InvoiceDocumentEntity | null> {
    return this.repository.findOne({
      invoice: { id: invoiceId },
      type: InvoiceDocumentType.Generated,
    });
  }
}
