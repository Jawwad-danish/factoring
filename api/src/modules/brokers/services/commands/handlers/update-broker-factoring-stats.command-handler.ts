import { BasicCommandHandler } from '@module-cqrs';
import { BrokerFactoringStatsEntity } from '@module-persistence/entities';
import { CommandHandler } from '@nestjs/cqrs';
import { BrokerStatsDataAccess } from '../../broker-stats.data-access';
import { UpdateBrokerFactoringStatsCommand } from '../update-broker-factoring-stats.command';

@CommandHandler(UpdateBrokerFactoringStatsCommand)
export class UpdateBrokerFactoringStatsCommandHandler
  implements BasicCommandHandler<UpdateBrokerFactoringStatsCommand>
{
  constructor(private readonly dataAccess: BrokerStatsDataAccess) {}

  async execute({
    brokerId,
  }: UpdateBrokerFactoringStatsCommand): Promise<BrokerFactoringStatsEntity> {
    const stats = await this.dataAccess.getOrCreate(brokerId);
    const result = await Promise.all([
      this.dataAccess.getTotalClientsWorkingWith(brokerId),
      this.dataAccess.getLastPaymentDate(brokerId),
      this.dataAccess.getTotalAging(brokerId),
      this.dataAccess.getDilutionMetrics(brokerId),
      this.dataAccess.getDaysToPayAverageMetrics([brokerId]),
      this.dataAccess.getTotalAmounts(brokerId),
      this.dataAccess.overallAverageDaysToPay(brokerId),
    ]);
    stats.totalClientsWorkingWith = result[0];
    stats.lastPaymentDate = result[1];
    stats.totalAging = result[2];
    stats.dilutionLast30Days = result[3].last30Days;
    stats.dilutionLast60Days = result[3].last60Days;
    stats.dilutionLast90Days = result[3].last90Days;
    stats.daysToPayLast30Days = result[4][0].metrics.last30Days;
    stats.daysToPayLast60Days = result[4][0].metrics.last60Days;
    stats.daysToPayLast90Days = result[4][0].metrics.last90Days;
    stats.totalInvoicesUnderReview = result[5].totalUnderReview;
    stats.totalInvoicesNonPayment = result[5].totalNonPayment;
    stats.totalInvoicesShortpaid = result[5].totalShortPaid;
    stats.totalInvoicesNotReceived = result[5].totalNotReceived;
    stats.averageDaysToPay = result[6];
    return stats;
  }
}
