import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { PendingBuyoutEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { PendingBuyout } from '@fs-bobtail/factoring/data';

@Injectable()
export class PendingBuyoutMapper
  implements DataMapper<PendingBuyoutEntity, PendingBuyout>
{
  constructor(private readonly userMapper: UserMapper) {}

  async entityToModel(entity: PendingBuyoutEntity): Promise<PendingBuyout> {
    const pendingBuyout = new PendingBuyout();
    pendingBuyout.id = entity.id;
    pendingBuyout.brokerMC = entity.brokerMC || undefined;
    pendingBuyout.brokerName = entity.brokerName || undefined;
    pendingBuyout.clientId = entity.clientId;
    pendingBuyout.loadNumber = entity.loadNumber;
    pendingBuyout.paymentDate = entity.paymentDate;
    pendingBuyout.rate = entity.rate;
    pendingBuyout.createdBy = await this.userMapper.createdByToModel(entity);
    pendingBuyout.updatedBy = await this.userMapper.updatedByToModel(entity);
    pendingBuyout.createdAt = entity.createdAt;
    pendingBuyout.updatedAt = entity.updatedAt;

    return pendingBuyout;
  }
}
