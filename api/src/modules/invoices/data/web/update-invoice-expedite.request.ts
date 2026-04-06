import { Expose } from 'class-transformer';
import { IsBoolean, IsString, IsUUID } from 'class-validator';
import { V1AwareBaseModel } from '@core/data';

export class UpdateInvoiceExpediteRequest extends V1AwareBaseModel<UpdateInvoiceExpediteRequest> {
  @IsUUID()
  @IsString()
  clientId: string;

  @IsBoolean()
  @Expose()
  expedite: boolean;
}
