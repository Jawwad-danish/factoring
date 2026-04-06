import { DataMapperUtil } from '@common';
import { DataMapper } from '@core/mapping';
import { PendingBuyoutsBatchEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { FactoringCompany, PendingBuyoutBatch } from '..';
import { PendingBuyoutMapper } from './pending-buyout.mapper';

@Injectable()
export class PendingBuyoutsBatchMapper
  implements DataMapper<PendingBuyoutsBatchEntity, PendingBuyoutBatch>
{
  constructor(private pendingBuyoutMapper: PendingBuyoutMapper) {}

  async entityToModel(
    entity: PendingBuyoutsBatchEntity,
  ): Promise<PendingBuyoutBatch> {
    const pendingBuyoutBatch = new PendingBuyoutBatch();
    pendingBuyoutBatch.id = entity.id;
    pendingBuyoutBatch.clientPayableFee = entity.clientPayableFee;
    pendingBuyoutBatch.bobtailPayableFee = entity.bobtailPayableFee;
    pendingBuyoutBatch.factoringCompany = new FactoringCompany({
      ...entity.factoringCompany,
    });
    pendingBuyoutBatch.pendingBuyouts =
      await DataMapperUtil.asyncMapCollections(
        entity.buyouts,
        this.pendingBuyoutMapper,
      );

    return pendingBuyoutBatch;
  }
}
