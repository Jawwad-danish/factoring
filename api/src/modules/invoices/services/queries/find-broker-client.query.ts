import { Broker } from '@module-brokers';
import { Client } from '@module-clients';
import { Query } from '@module-cqrs';

export class FindBrokerClientQuery extends Query<[Client, Broker | null]> {
  constructor(readonly clientId: string, readonly brokerId: string | null) {
    super();
  }
}
