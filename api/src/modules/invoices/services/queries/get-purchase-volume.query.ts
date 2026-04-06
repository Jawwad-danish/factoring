import { Query } from '@module-cqrs';
import { PurchaseVolume } from '../../data';

export class GetPurchaseVolumeQuery extends Query<PurchaseVolume> {}
