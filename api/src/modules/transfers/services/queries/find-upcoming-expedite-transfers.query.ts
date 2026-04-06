import { Query } from '@module-cqrs';
import { UpcomingExpediteTransfer } from '../../data';

export class FindUpcomingExpediteTransfersQuery extends Query<
  UpcomingExpediteTransfer[]
> {}
