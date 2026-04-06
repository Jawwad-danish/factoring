import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { Injectable } from '@nestjs/common';
import { BrokerFactoringStatsEntity } from '../../../persistence';
import { BrokerFactoringStats } from '../model';
@Injectable()
export class BrokerFactoringStatsMapper
  implements DataMapper<BrokerFactoringStatsEntity, BrokerFactoringStats>
{
  constructor(private readonly userMapper: UserMapper) {}

  async entityToModel(
    entity: BrokerFactoringStatsEntity,
  ): Promise<BrokerFactoringStats> {
    const model = new BrokerFactoringStats({
      brokerId: entity.brokerId,
      createdAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedAt: entity.updatedAt,
      updatedBy: await this.userMapper.updatedByToModel(entity),
      averageDaysToPay: entity.averageDaysToPay,
      underReviewTotal: entity.totalInvoicesUnderReview,
      shortpaidTotal: entity.totalInvoicesShortpaid,
      nonPaymentTotal: entity.totalInvoicesNonPayment,
      notReceivedTotal: entity.totalInvoicesNotReceived,
    });

    return model;
  }
}
