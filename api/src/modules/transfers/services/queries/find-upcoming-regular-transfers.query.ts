import { Query } from '@module-cqrs';
import { UpcomingRegularTransfer } from '../../data';

export class FindUpcomingRegularTransfersQuery extends Query<UpcomingRegularTransfer> {}
