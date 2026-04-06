import { Expose, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UpdateClientFactoringConfigRequest } from './client-factoring-config-update.request';
import { CorporationType, Languages } from './common-save-client-types';

export class UpdateClientRequest extends UpdateClientFactoringConfigRequest {
  @Expose()
  @IsOptional()
  @IsString()
  mc?: string;

  @Expose()
  @IsOptional()
  @IsString()
  dot?: string;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  authorityDate?: Date;

  @Expose()
  @IsString()
  businessName: string;

  @Expose()
  @IsString()
  shortName: string;

  @Expose()
  @IsOptional()
  @IsString()
  doingBusinessAs?: string;

  @Expose()
  @IsOptional()
  @IsString()
  ein?: string;

  @Expose()
  @IsOptional()
  @IsEnum(CorporationType)
  corporationType?: CorporationType;

  @Expose()
  @IsOptional()
  @ArrayNotEmpty()
  @IsEnum(Languages, { each: true })
  languages?: Languages[];
}
