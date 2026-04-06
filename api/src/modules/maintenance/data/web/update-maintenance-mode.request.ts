import { V1AwareBaseModel } from '@core/data';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMaintenanceModeRequest extends V1AwareBaseModel<UpdateMaintenanceModeRequest> {
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;

  @IsString()
  @IsOptional()
  message?: string;
}
