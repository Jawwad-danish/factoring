import { DatabaseService } from '@module-database';
import {
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class ReserveInvoiceRepository extends BasicRepository<ReserveInvoiceEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ReserveInvoiceEntity);
  }

  async findReserveFeeReserve(
    invoiceId: string,
  ): Promise<null | ReserveEntity> {
    const reserveInvoice = await this.repository.findOne(
      {
        invoice: {
          id: invoiceId,
        },
        reserve: {
          reason: ReserveReason.ReserveFee,
        },
      },
      {
        orderBy: { createdAt: 'desc' },
        populate: ['reserve'],
      },
    );

    return reserveInvoice?.reserve || null;
  }

  async findChargebackReserveByInvoiceId(
    invoiceId: string,
  ): Promise<null | ReserveEntity> {
    const reserveInvoice = await this.repository.findOne(
      {
        invoice: {
          id: invoiceId,
        },
        reserve: {
          reason: ReserveReason.Chargeback,
        },
      },
      {
        populate: ['reserve'],
      },
    );
    return reserveInvoice?.reserve || null;
  }
}
