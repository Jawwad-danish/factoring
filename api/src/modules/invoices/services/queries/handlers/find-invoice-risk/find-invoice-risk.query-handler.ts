import { TimeRangeMetrics } from '@common/data';
import { raw } from '@mikro-orm/core';
import { BrokerService } from '@module-brokers';
import { UpdateBrokerFactoringStatsCommand } from '@module-brokers/commands';
import { ClientService } from '@module-clients';
import { BasicQueryHandler, CommandRunner } from '@module-cqrs';
import { BrokerPaymentStatus } from '@module-persistence/entities';
import {
  BrokerFactoringStatsRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { QueryHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import {
  InvoiceRisk,
  InvoiceRiskBroker,
  InvoiceRiskClient,
} from '../../../../data';
import { InvoiceDataAccess } from '../../../invoice-data-access';
import { FindInvoiceRiskQuery } from '../../find-invoice-risk.query';

@QueryHandler(FindInvoiceRiskQuery)
export class FindInvoiceRiskQueryHandler
  implements BasicQueryHandler<FindInvoiceRiskQuery>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private clientService: ClientService,
    private brokerService: BrokerService,
    private invoiceDataAccess: InvoiceDataAccess,
    private brokerFactoringStatsRepository: BrokerFactoringStatsRepository,
    private commandRunner: CommandRunner,
  ) {}

  async execute({ id }: FindInvoiceRiskQuery): Promise<InvoiceRisk> {
    const { clientId, brokerId } = await this.invoiceRepository.getOneById(id);
    const [invoiceRiskClient, invoiceRiskBroker] = await Promise.all([
      this.buildInvoiceRiskClient(clientId, brokerId),
      this.buildInvoiceRiskBroker(brokerId),
    ]);
    return new InvoiceRisk({
      client: invoiceRiskClient,
      broker: invoiceRiskBroker,
    });
  }

  private async buildInvoiceRiskClient(
    clientId: string,
    brokerId: null | string,
  ) {
    const client = await this.clientService.getOneById(clientId);
    const clientStats = await this.buildClientStats(clientId, brokerId);
    return new InvoiceRiskClient({
      id: client.id,
      name: client.name,
      mc: client.mc,
      dot: client.dot,
      email: client.email,
      brokerConcentration: Number(clientStats.brokerConcentration.toFixed(2)),
      totalBrokers: clientStats.totalBrokers,
      totalOutstandingAging: clientStats.totalAging,
      dilution: clientStats.dilution,
      daysToPay: clientStats.daysToPay,
    });
  }

  private async buildInvoiceRiskBroker(
    brokerId: null | string,
  ): Promise<null | InvoiceRiskBroker> {
    if (brokerId == null) {
      return null;
    }

    const foundBroker = await this.brokerService.findOneById(brokerId);
    if (!foundBroker) {
      return null;
    }

    let brokerStats =
      await this.brokerFactoringStatsRepository.findOneByBrokerId(brokerId);
    if (!brokerStats) {
      brokerStats = await this.commandRunner.run(
        new UpdateBrokerFactoringStatsCommand(brokerId),
      );
    }

    return new InvoiceRiskBroker({
      id: foundBroker.id,
      name: foundBroker.legalName,
      mc: foundBroker.mc,
      dot: foundBroker.dot,
      phone: foundBroker.phone,
      displayRating: foundBroker.displayRating(),
      totalOutstandingAging: brokerStats.totalAging,
      lastPaymentDate: brokerStats.lastPaymentDate,
      totalClientsWorkingWith: brokerStats.totalClientsWorkingWith,
      dilution: new TimeRangeMetrics({
        last30Days: brokerStats.dilutionLast30Days,
        last60Days: brokerStats.dilutionLast60Days,
        last90Days: brokerStats.dilutionLast90Days,
      }),
      daysToPay: new TimeRangeMetrics({
        last30Days: brokerStats.daysToPayLast30Days,
        last60Days: brokerStats.daysToPayLast60Days,
        last90Days: brokerStats.daysToPayLast90Days,
      }),
    });
  }

  private async buildClientStats(clientId: string, brokerId: null | string) {
    const result = await Promise.all([
      this.getBrokerConcentration(brokerId, clientId),
      this.getTotalAging(brokerId, clientId),
      this.invoiceDataAccess.getClientTotalBrokersMetrics(clientId),
      this.invoiceDataAccess.getClientDilutionRateMetrics(clientId),
      this.invoiceDataAccess.getClientDaysToPayAverageMetrics(clientId),
    ]);
    return {
      brokerConcentration: result[0],
      totalAging: result[1],
      totalBrokers: result[2],
      dilution: result[3],
      daysToPay: result[4],
    };
  }

  private async getBrokerConcentration(
    brokerId: null | string,
    clientId: string,
  ): Promise<Big> {
    if (brokerId == null) {
      return new Big(-1);
    }

    const result = await this.invoiceRepository.execute(
      `select
      (COUNT(CASE WHEN i.broker_id = ? THEN 1 END) * 100.0)
      /
      COUNT(*) as concentration from invoices i WHERE client_id = ?`,
      [brokerId, clientId],
    );
    return new Big(result[0]?.concentration || -1);
  }

  private async getTotalAging(
    brokerId: null | string,
    clientId?: string,
  ): Promise<number> {
    if (brokerId == null) {
      return -1;
    }

    const result = await this.invoiceRepository
      .queryBuilder('i')
      .select(raw('SUM(i.accounts_receivable_value) as total'))
      .where({
        brokerId,
        clientId,
        brokerPaymentStatus: [
          BrokerPaymentStatus.NonPayment,
          BrokerPaymentStatus.NotReceived,
          BrokerPaymentStatus.NonFactoredPayment,
        ],
      })
      .execute('all', false);

    const rawResult = result[0] as any;
    return Number(rawResult?.total || 0);
  }
}
