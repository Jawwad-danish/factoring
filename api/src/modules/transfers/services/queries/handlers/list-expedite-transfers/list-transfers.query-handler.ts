import { BasicQueryHandler } from '@module-cqrs';
import { ListTransfersQuery } from '../../list-transfers.query';
import { QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import {
  ClientPaymentEntity,
  ClientPaymentRepository,
  PaymentOrderEntity,
  PaymentOrderRepository,
} from '@module-persistence';
import { Client, ClientService } from '@module-clients';
import { Arrays, safeJsonParse } from '@core/util';
import { FilterCriteria, FilterOperator, QueryCriteria } from '@core/data';
import {
  ListTransfersPaymentsResponse,
  TransfersPaymentsResponse,
} from '@fs-bobtail/factoring/data';
import { BatchTransferResponseV1, TransfersApi } from '../../../../api';

@QueryHandler(ListTransfersQuery)
export class ListTransfersQueryHandler
  implements BasicQueryHandler<ListTransfersQuery>
{
  private logger = new Logger(ListTransfersQueryHandler.name);

  constructor(
    private clientPaymentRepository: ClientPaymentRepository,
    private paymentOrderRepository: PaymentOrderRepository,
    private transferApi: TransfersApi,
    private clientService: ClientService,
  ) {}

  async execute(
    query: ListTransfersQuery,
  ): Promise<ListTransfersPaymentsResponse> {
    return this.fetchTransfersWithPagination(query.criteria);
  }

  private async fetchTransfersWithPagination(
    criteria: QueryCriteria,
  ): Promise<ListTransfersPaymentsResponse> {
    try {
      const batchTransfers = await this.transferApi.listTransfers(criteria);
      if (batchTransfers.items.length === 0 && batchTransfers.nextCursor) {
        return this.fetchNextPage(criteria, batchTransfers.nextCursor);
      }
      const transferDetails = await this.processTransfers(batchTransfers);
      if (transferDetails.length === 0 && batchTransfers.nextCursor) {
        return this.fetchNextPage(criteria, batchTransfers.nextCursor);
      }

      return {
        items: transferDetails,
        nextCursor: batchTransfers.nextCursor || '',
      };
    } catch (error) {
      this.logger.error(
        `Failed to list transfers with criteria: ${JSON.stringify(
          criteria,
        )}, error: ${error}`,
      );
      throw error;
    }
  }

  private async fetchNextPage(
    criteria: QueryCriteria,
    cursor: string,
  ): Promise<ListTransfersPaymentsResponse> {
    const nextPageCriteria = new QueryCriteria({
      ...criteria,
      filters: [
        ...(criteria.filters || []).filter((f) => f.name !== 'cursor'),
        new FilterCriteria({
          name: 'cursor',
          operator: FilterOperator.EQ,
          value: cursor,
        }),
      ],
    });

    return this.fetchTransfersWithPagination(nextPageCriteria);
  }

  private async processTransfers(batchTransfers: {
    items: BatchTransferResponseV1[];
  }): Promise<TransfersPaymentsResponse[]> {
    if (!batchTransfers.items.length) {
      return [];
    }

    const batchPaymentIds = Arrays.uniqueNotNull(
      batchTransfers.items,
      (batchTransfer) => batchTransfer.id,
    );
    const clientPayments = await this.clientPaymentRepository.find({
      batchPayment: { $in: batchPaymentIds },
    });
    const paymentOrders = await this.paymentOrderRepository.find({
      id: { $in: batchPaymentIds },
    });
    const clientPaymentsMap = new Map<
      string,
      ClientPaymentEntity | PaymentOrderEntity
    >();
    clientPayments.forEach((payment) =>
      clientPaymentsMap.set(payment.batchPayment.id, payment),
    );
    paymentOrders.forEach((paymentOrder) =>
      clientPaymentsMap.set(paymentOrder.id, paymentOrder),
    );
    const clientsMap = await this.fetchAndMapClients(
      clientPayments,
      paymentOrders,
    );

    return this.mapTransfersToDetails(
      batchTransfers.items,
      clientPaymentsMap,
      clientsMap,
    );
  }

  private async fetchAndMapClients(
    clientPayments: ClientPaymentEntity[],
    paymentOrders: PaymentOrderEntity[],
  ): Promise<Map<string, Client>> {
    const clientIds = Arrays.uniqueNotNull(
      [...clientPayments, ...paymentOrders],
      (payment) => payment.clientId,
    );
    if (clientIds.length === 0) {
      return new Map<string, Client>();
    }
    const clients = await this.clientService.findByIds(clientIds, {
      includeBankAccounts: true,
    });
    const clientsMap = new Map<string, Client>();
    clients.forEach((client) => {
      clientsMap.set(client.id, client);
    });
    return clientsMap;
  }

  private mapTransfersToDetails(
    batchTransfers: BatchTransferResponseV1[],
    clientPaymentsMap: Map<string, ClientPaymentEntity | PaymentOrderEntity>,
    clientsMap: Map<string, Client>,
  ): TransfersPaymentsResponse[] {
    const result: TransfersPaymentsResponse[] = [];

    for (const batchTransfer of batchTransfers) {
      const clientPayment = clientPaymentsMap.get(batchTransfer.id);

      const client = clientPayment
        ? clientsMap.get(clientPayment.clientId)
        : null;
      const clientBankAccount =
        client?.bankAccounts?.find(
          (bankAccount) =>
            bankAccount.id === clientPayment?.clientBankAccountId,
        ) || null;

      for (const transfer of batchTransfer.transfers || []) {
        result.push({
          id: clientPayment?.id || batchTransfer.id,
          transfersId: transfer.id || 'N/A',
          counterpartyName: client?.name || 'N/A',
          amount: transfer.amount,
          transferType: transfer.paymentType,
          status: transfer.state,
          failureReason: this.handleFailureReason(transfer.failureReason),
          paymentDate: new Date(transfer.createdAt),
          receivingAccount:
            clientBankAccount?.plaidAccount?.bankAccountOwnerName ||
            clientBankAccount?.name ||
            'N/A',
          bankAccountId: clientPayment?.clientBankAccountId || 'N/A',
          lastFourDigits: clientPayment?.bankAccountLastDigits || 'N/A',
          counterpartyBankName: clientBankAccount?.plaidAccount?.bankName,
        });
      }
    }

    return result;
  }

  private handleFailureReason(failureReason?: string): string {
    if (!failureReason) return '';

    const extract = (reason: any) =>
      Array.isArray(reason)
        ? reason[0]?.reasonDescription
        : reason?.reasonDescription;

    const parsedReason = safeJsonParse(failureReason);
    if (!parsedReason) {
      return failureReason;
    }

    const nestedReason =
      typeof parsedReason.message === 'string'
        ? safeJsonParse(parsedReason.message)
        : null;

    return (
      extract(nestedReason) ??
      nestedReason?.reasonDescription ??
      parsedReason?.response?.error ??
      extract(parsedReason) ??
      extract(parsedReason?.response?.reason) ??
      parsedReason?.error?.errors?.message ??
      parsedReason?.error?.message ??
      (typeof parsedReason?.message === 'string'
        ? parsedReason.message
        : null) ??
      JSON.stringify(parsedReason)
    );
  }
}
