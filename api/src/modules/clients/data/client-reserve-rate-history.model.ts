import { TransformFromBig } from '@core/decorators';
import { AuditBaseModel } from '@core/data';
import { ClientReserveRateReason } from '@module-persistence';
import { Big } from 'big.js';
import { Expose, Type } from 'class-transformer';

export class ClientReserveRateHistory extends AuditBaseModel<ClientReserveRateHistory> {
  @Expose()
  id: string;

  @TransformFromBig()
  @Type(() => String)
  @Expose()
  reserveRatePercentage: Big;

  @Expose()
  reserveRateReason: ClientReserveRateReason;

  @Expose()
  note: string;
}
