import { Expose } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';
import { BaseModel } from '@core/data';

export class BrokerFlags extends BaseModel<BrokerFlags> {
  @IsUUID()
  @IsOptional()
  @Expose()
  id?: string;

  @IsUUID()
  @Expose()
  brokerId: string;

  @IsUUID()
  @Expose()
  flagId: string;
}
