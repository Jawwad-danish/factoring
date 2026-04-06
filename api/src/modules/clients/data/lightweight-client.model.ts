import { BaseModel } from '@core/data';
import { Expose } from 'class-transformer';
import { AuthorityState, InsuranceStatus } from './client.model';

export class LightweightClient extends BaseModel<LightweightClient> {
  @Expose()
  id: string;

  @Expose()
  mc: string;

  @Expose()
  dot: string;

  @Expose()
  name: string;

  @Expose()
  insuranceStatus: InsuranceStatus;

  @Expose({ name: 'commonAuthorityStatus' })
  authorityStatus: AuthorityState;

  @Expose({ name: 'allowedToOperate' })
  allowedToOperate: string;
}
