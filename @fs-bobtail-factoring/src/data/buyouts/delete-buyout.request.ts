import { Exclude } from 'class-transformer';
import { V1AwareBaseModel } from '../common';

@Exclude()
export class DeleteBuyoutRequest extends V1AwareBaseModel<DeleteBuyoutRequest> {}
