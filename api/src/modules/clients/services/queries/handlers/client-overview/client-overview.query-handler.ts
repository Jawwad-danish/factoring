import {
  ClientPaymentStatus,
  InvoiceStatus,
  RecordStatus,
  TagDefinitionGroupKey,
} from '@module-persistence';
import { Repositories } from '@module-persistence/repositories';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { ClientOverview, LastTransfer } from '../../../../data';
import { ClientOverviewQuery } from '../../client-overview.query';

@QueryHandler(ClientOverviewQuery)
export class ClientOverviewQueryHandler
  implements IQueryHandler<ClientOverviewQuery, ClientOverview>
{
  constructor(private readonly repositories: Repositories) {}

  async execute({ clientId }: ClientOverviewQuery): Promise<ClientOverview> {
    const totalReservesAmount =
      await this.repositories.reserve.getTotalByClient(clientId);
    const invoicesNeedsAttentionCount =
      await this.getInvoicesNeedsAttentionCount(clientId);
    const invoicesPossibleChargebacksCount =
      await this.getInvoicesPossibleChargebacksCount(clientId);
    const invoicesProcessingCount = await this.getInvoicesProcessingCount(
      clientId,
    );
    const lastTransfer = await this.getLastTransfer(clientId);
    return new ClientOverview({
      totalReservesAmount: new Big(totalReservesAmount),
      invoicesNeedsAttentionCount,
      invoicesPossibleChargebacksCount,
      invoicesProcessingCount,
      lastTransfer,
    });
  }

  private async getInvoicesNeedsAttentionCount(
    clientId: string,
  ): Promise<number> {
    return await this.repositories.invoice.count({
      clientId,
      status: [InvoiceStatus.UnderReview, InvoiceStatus.Purchased],
      clientPaymentStatus: [
        ClientPaymentStatus.NotApplicable,
        ClientPaymentStatus.Pending,
      ],
      tags: {
        recordStatus: RecordStatus.Active,
        tagDefinition: {
          group: {
            group: {
              key: TagDefinitionGroupKey.INVOICE_ISSUES,
            },
          },
        },
      },
    });
  }

  private async getInvoicesPossibleChargebacksCount(
    clientId: string,
  ): Promise<number> {
    return await this.repositories.invoice.count({
      clientId,
      status: InvoiceStatus.Purchased,
      clientPaymentStatus: [
        ClientPaymentStatus.InProgress,
        ClientPaymentStatus.Completed,
        ClientPaymentStatus.Sent,
      ],
      tags: {
        recordStatus: RecordStatus.Active,
        tagDefinition: {
          group: {
            group: {
              key: TagDefinitionGroupKey.INVOICE_ISSUES,
            },
          },
        },
      },
    });
  }

  private async getInvoicesProcessingCount(clientId: string): Promise<number> {
    return await this.repositories.invoice.count({
      clientId,
      status: [InvoiceStatus.UnderReview, InvoiceStatus.Purchased],
      clientPaymentStatus: [
        ClientPaymentStatus.NotApplicable,
        ClientPaymentStatus.Pending,
      ],
      tags: {
        recordStatus: RecordStatus.Active,
        tagDefinition: {
          group: {
            group: {
              key: {
                $nin: [
                  TagDefinitionGroupKey.INVOICE_ISSUES,
                  TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
                ],
              },
            },
          },
        },
      },
    });
  }

  private async getLastTransfer(
    clientId: string,
  ): Promise<null | LastTransfer> {
    const lastPayment = await this.repositories.clientPaymentRepository.findOne(
      {
        clientId,
      },
      {
        orderBy: {
          createdAt: 'DESC',
        },
      },
    );
    return lastPayment != null
      ? {
          id: lastPayment.id,
          amount: lastPayment.amount,
        }
      : null;
  }
}
