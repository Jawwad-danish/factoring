import { environment } from '@core/environment';
import { ValidationError } from '@core/validation';
import { FilterQuery } from '@mikro-orm/core';
import { BasicCommandHandler } from '@module-cqrs';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  PaymentType,
  Repositories,
} from '@module-persistence';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { UpdateTransferStatusCommand } from '../../update-transfer-status.command';
import { UpdateTransferStatusStrategyFactory } from './strategies';

const finalStatuses = [
  ClientBatchPaymentStatus.Done,
  ClientBatchPaymentStatus.Failed,
  ClientBatchPaymentStatus.NotSent,
];

@CommandHandler(UpdateTransferStatusCommand)
export class UpdateTransferStatusCommandHandler
  implements BasicCommandHandler<UpdateTransferStatusCommand>
{
  private logger: Logger = new Logger(UpdateTransferStatusCommandHandler.name);

  constructor(
    private readonly repositories: Repositories,
    private readonly strategyFactory: UpdateTransferStatusStrategyFactory,
  ) {}

  async execute(command: UpdateTransferStatusCommand): Promise<void> {
    const batchPayment = await this.loadBatchPayment(command);
    if (finalStatuses.includes(batchPayment.status)) {
      this.logger.warn(
        `Batch payment ${batchPayment.id} is already in final state ${batchPayment.status}. Skipping update`,
      );
      return;
    }
    const strategy = this.strategyFactory.getStrategy(batchPayment.type);
    await strategy.update(batchPayment, command.request.data);
  }

  private async loadBatchPayment(
    command: UpdateTransferStatusCommand,
  ): Promise<ClientBatchPaymentEntity> {
    let batchPayment = await this.repositories.clientBatchPayment.findOneById(
      command.request.data.externalId,
      { populate: ['clientPayments'] },
    );
    if (!batchPayment) {
      batchPayment = await this.findScheduledAch(command);
    }

    if (!batchPayment) {
      const message = `Batch payment ${command.request.data.externalId} not found`;
      this.logger.error(message);
      throw new ValidationError('batch-payment-not-found', message);
    }
    return batchPayment;
  }

  // special case for scheduled ach payments from v1 - TODO: Delete after we deprecate v1
  private async findScheduledAch(
    command: UpdateTransferStatusCommand,
  ): Promise<ClientBatchPaymentEntity | null> {
    const metadata = command.request.data.metadata;
    if (!metadata) {
      this.logger.error(`No metadata found`);
      return null;
    }

    this.logger.debug(`Metadata: ${JSON.stringify(metadata)}`);

    if (!metadata['v1TransferTime']?.startsWith('scheduled')) {
      this.logger.error(
        `Not a scheduled payment - v1TransferTime: ${metadata['v1TransferTime']}`,
      );
      return null;
    }

    if (!metadata['fromV1'] || !metadata['v1CreatedAt']) {
      this.logger.error(`Not enough metadata to find scheduled ach payment`);
      return null;
    }

    const oneMinuteMS = 60 * 1000;
    const v1CreatedAt = new Date(metadata['v1CreatedAt']);

    const where: FilterQuery<ClientBatchPaymentEntity> = {
      createdAt: {
        $gte: new Date(v1CreatedAt.getTime() - oneMinuteMS),
        $lte: new Date(v1CreatedAt.getTime() + oneMinuteMS),
      },
      type: PaymentType.ACH,
      createdBy: environment.core.systemId(),
    };

    const batchPayment = await this.repositories.clientBatchPayment.findOne(
      where,
      {
        populate: ['clientPayments'],
      },
    );
    if (!batchPayment) {
      this.logger.error(
        `No scheduled ach payment found for ${command.request.data.externalId}`,
      );
      return null;
    }
    this.logger.debug(
      `Found scheduled ach payment ${batchPayment.id}. Overriding id with ${command.request.data.externalId}`,
    );
    // override id with externalId to match v1
    batchPayment.id = command.request.data.externalId;

    return batchPayment;
  }
}
