import { EntityNotFoundError } from '@core/errors';
import { BrokerFactoringConfigEntity } from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BasicRepository } from './basic-repository';
import { FindOptions } from '@mikro-orm/core';
import { Paths } from '@core/types';

interface BrokerFetchOptions {
  includeLimitHistory?: boolean;
}

@Injectable()
export class BrokerFactoringConfigRepository extends BasicRepository<BrokerFactoringConfigEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, BrokerFactoringConfigEntity);
  }

  findOneByBrokerId(
    brokerId: string,
  ): Promise<BrokerFactoringConfigEntity | null> {
    return this.repository.findOne({
      brokerId: brokerId,
    });
  }

  async getOneByBrokerId(
    brokerId: string,
  ): Promise<BrokerFactoringConfigEntity> {
    const config = await this.findOneByBrokerId(brokerId);
    if (!config) {
      throw EntityNotFoundError.byId(
        brokerId,
        'Broker factoring configuration',
      );
    }
    return config;
  }

  async findByBrokerIds(
    brokerIds: string[],
    options?: BrokerFetchOptions,
  ): Promise<BrokerFactoringConfigEntity[]> {
    const result = await this.find(
      {
        brokerId: { $in: brokerIds },
      },
      this.buildFindOptions(options),
    );
    return result;
  }

  private buildFindOptions(
    options?: BrokerFetchOptions,
  ): FindOptions<BrokerFactoringConfigEntity, any> {
    const populate: Paths<BrokerFactoringConfigEntity>[] = [];
    if (options?.includeLimitHistory) {
      populate.push('limitHistory');
    }

    return {
      populate,
    };
  }
}
