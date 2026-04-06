import { V1AwareBaseModel } from '@core/data';
import { Exclude } from 'class-transformer';

@Exclude()
export class DeleteReserveRequest extends V1AwareBaseModel<DeleteReserveRequest> {}
