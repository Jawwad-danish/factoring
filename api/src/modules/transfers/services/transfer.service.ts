import { QueryCriteria } from '@core/data';
import { CrossCuttingConcerns } from '@core/util';
import { UUID } from '@core/uuid';
import {
  CreatePaymentOrderRequest,
  ListTransfersPaymentsResponse,
  PaymentOrder,
} from '@fs-bobtail/factoring/data';
import { LoadStrategy } from '@mikro-orm/core';
import { CommandRunner, EventPublisher, QueryRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { ClientBatchPaymentRepository } from '@module-persistence';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import {
  InitiateDebitRegularTransferRequest,
  InitiateExpediteTransferRequest,
  InitiateRegularTransferRequest,
  TransferCreated,
  UpcomingExpediteTransfer,
  UpcomingRegularTransfer,
  UpdateTransferStatusWebhookRequest,
} from '../data';
import {
  CreatePaymentOrderCommand,
  InitiateDebitRegularTransferCommand,
  InitiateExpediteTransferCommand,
  InitiateRegularTransferCommand,
  UpdateTransferStatusCommand,
} from './commands';
import {
  CreatePaymentOrderError,
  ExpediteTransferError,
  RegularTransferError,
} from './errors';
import {
  FindCompletedTransfersQuery,
  FindCompletedTransfersQueryResult,
  FindUpcomingExpediteTransfersQuery,
  FindUpcomingRegularTransfersQuery,
  ListTransfersQuery,
  VerifyRtpForClientsQuery,
} from './queries';

@Injectable()
export class TransferService {
  constructor(
    private readonly clientBatchPaymentRepository: ClientBatchPaymentRepository,
    private readonly queryRunner: QueryRunner,
    private readonly commandRunner: CommandRunner,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async verifyRtp(clientIds: string[]): Promise<string[]> {
    return this.queryRunner.run(new VerifyRtpForClientsQuery(clientIds));
  }

  getOneById(id: string): Promise<ClientBatchPaymentEntity> {
    return this.clientBatchPaymentRepository.getOneById(id, {
      populate: ['clientPayments'],
      strategy: LoadStrategy.SELECT_IN,
    });
  }

  findAllCompleted(
    criteria: QueryCriteria,
  ): Promise<FindCompletedTransfersQueryResult> {
    return this.queryRunner.run(new FindCompletedTransfersQuery(criteria));
  }

  getUpcomingExpediteTransfers(): Promise<UpcomingExpediteTransfer[]> {
    return this.queryRunner.run(new FindUpcomingExpediteTransfersQuery());
  }

  getUpcomingRegularTransfers(): Promise<UpcomingRegularTransfer> {
    return this.queryRunner.run(new FindUpcomingRegularTransfersQuery());
  }

  @Transactional('initiate-debit-regular-transfer')
  initiateDebitRegularTransfer(
    payload: InitiateDebitRegularTransferRequest,
  ): Promise<ClientBatchPaymentEntity> {
    return this.commandRunner.run(
      new InitiateDebitRegularTransferCommand(payload),
    );
  }

  @CrossCuttingConcerns<TransferService, 'doInitiateExpediteTransfer'>({
    logging: ({ clientId }: InitiateExpediteTransferRequest) => {
      return {
        message: 'Initiating expedite transfer service',
        payload: {
          clientId,
        },
      };
    },
    error: {
      errorSupplier: (cause, { clientId }: InitiateExpediteTransferRequest) =>
        new ExpediteTransferError(clientId, cause),
    },
  })
  @Transactional('initiate-expedite-transfer')
  doInitiateExpediteTransfer(
    payload: InitiateExpediteTransferRequest,
  ): Promise<ClientBatchPaymentEntity> {
    return this.commandRunner.run(new InitiateExpediteTransferCommand(payload));
  }

  async initiateExpediteTransfer(
    payload: InitiateExpediteTransferRequest,
  ): Promise<ClientBatchPaymentEntity> {
    const batchPayment = await this.doInitiateExpediteTransfer(payload);
    this.eventPublisher.emit(TransferCreated.EVENT_NAME, {
      transferId: batchPayment.id,
    });
    return batchPayment;
  }

  @Transactional('update-transfer-status')
  updateTransferStatus(
    payload: UpdateTransferStatusWebhookRequest,
  ): Promise<void> {
    return this.commandRunner.run(new UpdateTransferStatusCommand(payload));
  }

  @CrossCuttingConcerns<TransferService, 'doInitiateRegularTransfer'>({
    logging: (payload: InitiateRegularTransferRequest) => {
      return {
        message: 'Initiating regular transfer',
        payload,
      };
    },
    error: {
      errorSupplier: (cause) => new RegularTransferError(cause),
    },
  })
  doInitiateRegularTransfer(
    payload: InitiateRegularTransferRequest,
  ): Promise<ClientBatchPaymentEntity> {
    if (!payload.id) {
      payload.id = UUID.get();
    }
    return this.commandRunner.run(new InitiateRegularTransferCommand(payload));
  }

  async initiateRegularTransfer(
    payload: InitiateRegularTransferRequest,
  ): Promise<ClientBatchPaymentEntity> {
    const batchPayment = await this.doInitiateRegularTransfer(payload);
    this.eventPublisher.emit(TransferCreated.EVENT_NAME, {
      transferId: batchPayment.id,
    });
    return batchPayment;
  }

  @CrossCuttingConcerns<TransferService, 'createPaymentOrder'>({
    logging: ({ clientId, bankAccountId }: CreatePaymentOrderRequest) => {
      return {
        message: 'create payment order service',
        payload: {
          clientId,
          bankAccountId,
        },
      };
    },
    error: {
      errorSupplier: (
        cause,
        { clientId, bankAccountId }: CreatePaymentOrderRequest,
      ) => new CreatePaymentOrderError(clientId, bankAccountId, cause),
    },
  })
  @Transactional('create-payment-order')
  async createPaymentOrder(
    payload: CreatePaymentOrderRequest,
  ): Promise<PaymentOrder> {
    return this.commandRunner.run(new CreatePaymentOrderCommand(payload));
  }

  async listTransfers(
    criteria: QueryCriteria,
  ): Promise<ListTransfersPaymentsResponse> {
    return this.queryRunner.run(new ListTransfersQuery(criteria));
  }
}
