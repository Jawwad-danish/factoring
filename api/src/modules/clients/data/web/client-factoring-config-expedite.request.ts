import { V1AwareBaseModel } from '@core/data';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClientFactoringConfigExpediteRequest extends V1AwareBaseModel<UpdateClientFactoringConfigExpediteRequest> {
  @IsOptional()
  @IsBoolean()
  expediteTransferOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  doneSubmittingInvoices?: boolean;
}
