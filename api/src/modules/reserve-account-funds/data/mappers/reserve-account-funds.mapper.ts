import { DataMapper } from '@core/mapping';
import { ReserveAccountFunds } from '@fs-bobtail/factoring/data';
import { UserMapper } from '@module-common';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReserveAccountFundsMapper
  implements DataMapper<ReserveAccountFundsEntity, ReserveAccountFunds>
{
  constructor(private userMapper: UserMapper) {}

  async entityToModel(
    entity: ReserveAccountFundsEntity,
  ): Promise<ReserveAccountFunds> {
    return new ReserveAccountFunds({
      id: entity.id,
      clientId: entity.clientId,
      amount: entity.amount,
      note: entity.note,
      createdAt: entity.createdAt,
      updatedAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedBy: await this.userMapper.createdByToModel(entity),
    });
  }
}
