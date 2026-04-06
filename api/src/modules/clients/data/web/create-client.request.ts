import {
  IsBigRange,
  IsCaState,
  IsUsState,
  TransformToBig,
} from '@core/decorators';
import { Expose, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPostalCode,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import Big from 'big.js';
import {
  CorporationType,
  Country,
  Languages,
  LeadAttribution,
} from './common-save-client-types';

export class CreateClientRequest {
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
  @IsNotEmpty()
  @IsEnum(CorporationType)
  corporationType: CorporationType;

  @Expose()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(Country)
  country: Country;

  @Expose()
  @IsNotEmpty()
  @IsString()
  address: string;

  @Expose()
  @IsOptional()
  @IsString()
  address2: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  city: string;

  @Expose()
  @IsNotEmpty()
  @ValidateIf((o) => o.country === Country.US)
  @IsUsState()
  @ValidateIf((o) => o.country === Country.CA)
  @IsCaState()
  state: string;

  @Expose()
  @IsNotEmpty()
  @IsPostalCode('US')
  zip: string;

  @Expose()
  @IsNotEmpty()
  @IsPhoneNumber('US')
  phoneNumber: string;

  @Expose()
  @IsNotEmpty()
  @TransformToBig()
  @IsBigRange({ min: 0, max: 50 })
  factoringRate: Big;

  @Expose()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Languages, { each: true })
  languages: Languages[];

  @Expose()
  @IsNotEmpty()
  @IsEnum(LeadAttribution)
  leadAttribution: LeadAttribution;

  @Expose()
  @IsUUID()
  clientSuccessTeamId: string;

  @Expose()
  @IsOptional()
  @IsUUID()
  salesRepId?: string;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  insuranceRenewalDate?: Date;

  @Expose()
  @IsOptional()
  @IsString()
  mc?: string;

  @Expose()
  @IsString()
  dot: string;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  authorityDate?: Date;
}
