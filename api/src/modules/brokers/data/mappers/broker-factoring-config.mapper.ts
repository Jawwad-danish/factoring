import { DataMapperUtil } from '@common';
import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { Injectable } from '@nestjs/common';
import { BrokerFactoringConfigEntity } from '../../../persistence';
import { BrokerFactoringConfig, BrokerLimitHistory } from '../model';
@Injectable()
export class BrokerFactoringConfigMapper
  implements DataMapper<BrokerFactoringConfigEntity, BrokerFactoringConfig>
{
  constructor(private readonly userMapper: UserMapper) {}

  async entityToModel(
    entity: BrokerFactoringConfigEntity,
  ): Promise<BrokerFactoringConfig> {
    const model = new BrokerFactoringConfig({
      brokerId: entity.brokerId,
      limitAmount: entity.limitAmount,
      limitHistory: await DataMapperUtil.asyncMapCollections(
        entity.limitHistory,
        async (item) =>
          new BrokerLimitHistory({
            id: item.id,
            note: item.note,
            amount: item.limitAmount,
            createdBy: await this.userMapper.createdByToModel(item),
            createdAt: item.createdAt,
          }),
      ),
      verificationDelay: entity.verificationDelay,
      preferences: entity.preferences,
      createdAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedAt: entity.updatedAt,
      updatedBy: await this.userMapper.updatedByToModel(entity),
    });

    return model;
  }
}
