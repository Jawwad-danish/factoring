import { BrokerFactoringStatsEntity } from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BasicRepository } from './basic-repository';

@Injectable()
export class BrokerFactoringStatsRepository extends BasicRepository<BrokerFactoringStatsEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, BrokerFactoringStatsEntity);
  }

  findOneByBrokerId(
    brokerId: string,
  ): Promise<BrokerFactoringStatsEntity | null> {
    return this.repository.findOne({
      brokerId: brokerId,
    });
  }

  async findByBrokerIds(
    brokerIds: string[],
  ): Promise<BrokerFactoringStatsEntity[]> {
    const result = await this.find({
      brokerId: { $in: brokerIds },
    });
    return result;
  }
}
