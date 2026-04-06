import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Client, ClientService } from '@module-clients';
import { Broker, BrokerService } from '@module-brokers';
import { FindBrokerClientQuery } from '../../find-broker-client.query';
import { InvoiceDataAccess } from '../../../invoice-data-access';

@QueryHandler(FindBrokerClientQuery)
export class FindBrokerClientQueryHandler
  implements IQueryHandler<FindBrokerClientQuery, [Client, Broker | null]>
{
  constructor(
    readonly clientService: ClientService,
    readonly brokerService: BrokerService,
    readonly invoiceDataAccess: InvoiceDataAccess,
  ) {}

  async execute(
    query: FindBrokerClientQuery,
  ): Promise<[Client, Broker | null]> {
    const client = await this.clientService.getOneById(query.clientId, {
      includeUser: true,
    });
    [client.dilutionRate, client.chargebacks] = await Promise.all([
      this.invoiceDataAccess.getDilutionRate(query.clientId),
      this.invoiceDataAccess.getClientRecentChargebacks(query.clientId),
    ]);
    let broker: Broker | null = null;
    if (query.brokerId !== null) {
      broker = await this.brokerService.findOneById(query.brokerId);
    }
    return [client, broker];
  }
}
