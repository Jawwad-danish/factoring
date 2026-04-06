import { TransformFromBig } from '@core/decorators';
import { AuditBaseModel } from '@core/data';
import { ClientFactoringRateReason } from '@module-persistence';
import { Big } from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class ClientFactoringRateHistory extends AuditBaseModel<ClientFactoringRateHistory> {
  @Expose()
  id: string;

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  factoringRatePercentage: Big;

  @Expose()
  @IsEnum(ClientFactoringRateReason)
  factoringRateReason: ClientFactoringRateReason;

  @Expose()
  note: string;
}
