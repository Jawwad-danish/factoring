import { UUID } from '@core/uuid';
import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import { BasicCommandHandler } from '@module-cqrs';
import {
  PendingBuyoutEntity,
  PendingBuyoutsBatchEntity,
  RecordStatus,
} from '@module-persistence/entities';
import {
  PendingBuyoutRepository,
  PendingBuyoutsBatchRepository,
} from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { CreateBuyoutsBatchCommand } from '../../create-buyouts-batch.command';

@CommandHandler(CreateBuyoutsBatchCommand)
export class CreateBuyoutsBatchCommandHandler
  implements BasicCommandHandler<CreateBuyoutsBatchCommand>
{
  private logger: Logger = new Logger(CreateBuyoutsBatchCommandHandler.name);

  constructor(
    private readonly pendingBuyoutsBatchRepository: PendingBuyoutsBatchRepository,
    private readonly pendingBuyoutRepository: PendingBuyoutRepository,
  ) {}

  async execute({
    request,
  }: CreateBuyoutsBatchCommand): Promise<PendingBuyoutsBatchEntity> {
    const { batch } = request;
    const pendingBuyoutsBatchEntity = new PendingBuyoutsBatchEntity();
    pendingBuyoutsBatchEntity.factoringCompany = null;
    await this.cleanupExistingBuyouts();
    batch.forEach((entry) => {
      const pendingBuyout = this.createPendingBuyoutEntity(
        entry,
        pendingBuyoutsBatchEntity,
      );
      pendingBuyoutsBatchEntity.buyouts.add(pendingBuyout);
    });
    this.pendingBuyoutsBatchRepository.persist(pendingBuyoutsBatchEntity);
    return pendingBuyoutsBatchEntity;
  }

  private async cleanupExistingBuyouts() {
    const { affectedRows } = await this.pendingBuyoutRepository
      .queryBuilder()
      .update({ recordStatus: RecordStatus.Inactive })
      .execute();
    const { affectedRows: batchAffectedRows } =
      await this.pendingBuyoutsBatchRepository
        .queryBuilder()
        .update({ recordStatus: RecordStatus.Inactive })
        .execute();
    this.logger.log(`Soft deleted ${affectedRows} existing buyouts`);
    this.logger.log(
      `Soft deleted ${batchAffectedRows} existing buyouts batches`,
    );
  }

  private createPendingBuyoutEntity(
    request: CreateBuyoutsRequest,
    batchEntity: PendingBuyoutsBatchEntity,
  ): PendingBuyoutEntity {
    const pendingBuyoutEntity = new PendingBuyoutEntity();
    pendingBuyoutEntity.id = request.id || UUID.get();
    pendingBuyoutEntity.clientId = request.clientId;
    pendingBuyoutEntity.loadNumber = request.loadNumber;
    pendingBuyoutEntity.paymentDate = new Date(request.buyoutDate);
    pendingBuyoutEntity.brokerMC = request.mc;
    pendingBuyoutEntity.rate = request.rate ? Big(request.rate) : Big(0);
    pendingBuyoutEntity.batch = batchEntity;
    pendingBuyoutEntity.brokerName = request.brokerName;
    return pendingBuyoutEntity;
  }
}
