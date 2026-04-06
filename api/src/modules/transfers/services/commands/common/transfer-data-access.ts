import { QBFilterQuery, raw } from '@mikro-orm/core';
import {
  ClientBatchPaymentStatus,
  ClientFactoringConfigsEntity,
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  PaymentStatus,
  PaymentType,
  RecordStatus,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { EntityStorage, Repositories } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransferDataAccess implements EntityStorage {
  constructor(private readonly repositories: Repositories) {}

  persist<TEntity extends object>(entity: TEntity | TEntity[]): void {
    return this.repositories.persist(entity);
  }

  async persistAndFlush<TEntity extends object>(
    entity: TEntity | TEntity[],
  ): Promise<void> {
    return this.repositories.persistAndFlush(entity);
  }

  async getClientInvoicesForExpediteTransfer(
    clientId: string,
  ): Promise<InvoiceEntity[]> {
    return await this.repositories.invoice.find({
      clientId: clientId,
      clientPaymentStatus: {
        $in: [ClientPaymentStatus.Pending, ClientPaymentStatus.Failed],
      },
      buyout: null,
      status: InvoiceStatus.Purchased,
      recordStatus: RecordStatus.Active,
    });
  }

  private getRegularTransferWhereClause(
    includeExpedited: boolean,
  ): QBFilterQuery<InvoiceEntity> {
    const whereClause: QBFilterQuery<InvoiceEntity> = {
      clientPaymentStatus: {
        $in: [ClientPaymentStatus.Pending, ClientPaymentStatus.Failed],
      },
      buyout: null,
      expedited: false,
      status: InvoiceStatus.Purchased,
      recordStatus: RecordStatus.Active,
    };
    if (includeExpedited) {
      delete whereClause.expedited;
    }
    return whereClause;
  }

  async getInvoicesForRegularTransfer(
    includeExpedited = false,
  ): Promise<InvoiceEntity[]> {
    const whereClause = this.getRegularTransferWhereClause(includeExpedited);
    return await this.repositories.invoice.find(whereClause);
  }

  async getReleaseOfFunds(): Promise<ReserveEntity[]> {
    return await this.repositories.reserve.find({
      reason: ReserveReason.ReleaseOfFunds,
      recordStatus: RecordStatus.Active,
      payload: {
        reversedByReserveId: null,
      },
      reserveClientPayments: {
        clientPayment: {
          $or: [
            {
              status: PaymentStatus.FAILED,
            },
            {
              status: null,
            },
          ],
        },
      },
    });
  }

  async getClientFactoringConfig(
    clientId: string,
  ): Promise<ClientFactoringConfigsEntity> {
    return await this.repositories.clientFactoringConfig.getOneByClientId(
      clientId,
    );
  }

  async expediteClients(): Promise<string[]> {
    const result = await this.repositories.invoice
      .queryBuilder()
      .select('clientId')
      .where({
        clientPaymentStatus: ClientPaymentStatus.Pending,
        expedited: true,
        status: InvoiceStatus.Purchased,
      })
      .groupBy('clientId')
      .execute('all');
    return result.map((item) => item.clientId);
  }

  async getInvoicesForExpediteTransfer(
    clientIds: string[],
  ): Promise<InvoiceEntity[]> {
    const result = await this.repositories.invoice.find({
      clientId: { $in: clientIds },
      status: {
        $in: [InvoiceStatus.UnderReview, InvoiceStatus.Purchased],
      },
      clientPaymentStatus: {
        $ne: null,
        $in: [
          ClientPaymentStatus.NotApplicable,
          ClientPaymentStatus.Pending,
          ClientPaymentStatus.Failed,
        ],
      },
      recordStatus: RecordStatus.Active,
    });
    return result;
  }

  async isRegularBatchPaymentInProgress(): Promise<boolean> {
    const count = await this.repositories.clientBatchPayment.count({
      type: PaymentType.ACH,
      status: ClientBatchPaymentStatus.InProgress,
    });
    return count > 0;
  }
  async hasRecentTransfersInitiated(clientId: string): Promise<boolean> {
    const recentExpedite =
      await this.repositories.clientPaymentRepository.count({
        clientId: clientId,
        transferType: PaymentType.WIRE,
        status: {
          $in: [PaymentStatus.PENDING, PaymentStatus.DONE],
        },
        recordStatus: RecordStatus.Active,
        createdAt: {
          $gte: raw(`NOW() - INTERVAL '10 minutes'`),
        },
      });

    return recentExpedite > 0;
  }
}
