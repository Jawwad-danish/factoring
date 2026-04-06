import { Query } from '@module-cqrs';
import { ClientOverview } from '../../data';

export class ClientOverviewQuery extends Query<ClientOverview> {
  constructor(readonly clientId: string) {
    super();
  }
}
