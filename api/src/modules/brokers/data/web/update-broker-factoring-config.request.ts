import { V1AwareBaseModel } from '@core/data';
import { TransformToBig } from '@core/decorators';
import Big from 'big.js';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateBrokerFactoringConfigRequest extends V1AwareBaseModel<UpdateBrokerFactoringConfigRequest> {
  @ValidateIf((obj) => obj.limitNote != null)
  @Type(() => String)
  @TransformToBig()
  limitAmount?: Big | null;

  @ValidateIf((obj) => obj.limitAmount !== undefined)
  @IsOptional()
  @IsString()
  limitNote?: string;

  @IsOptional()
  @IsBoolean()
  verificationDelay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Must be at most 255 characters' })
  preferences?: string;
}
