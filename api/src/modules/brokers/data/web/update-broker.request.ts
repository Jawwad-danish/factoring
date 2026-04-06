import { Expose, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPostalCode,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UpdateBrokerFactoringConfigRequest } from './update-broker-factoring-config.request';
import { Country, Rating } from './create-broker.request';
import { IsCaState, IsUsState } from '@core/decorators';

export class UpdateBrokerRequest extends UpdateBrokerFactoringConfigRequest {
  @Expose()
  @IsOptional()
  @IsString()
  legalName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  dot?: string;

  @Expose()
  @IsOptional()
  @IsString()
  mc?: string;

  @Expose()
  @IsOptional()
  @IsString()
  doingBusinessAs?: string;

  @Expose()
  @IsOptional()
  @IsString()
  phone?: string;

  @Expose()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  authorityDate?: Date;

  @Expose()
  @IsOptional()
  bobtailStatus?: string;

  @Expose()
  @IsOptional()
  @IsEnum(Rating)
  rating?: Rating;

  @Expose()
  @IsOptional()
  @IsEnum(Rating)
  externalRating?: Rating;

  @Expose()
  @IsOptional()
  ratingReason?: string;

  @Expose()
  @IsOptional()
  portalUrl?: string;

  @Expose()
  @IsOptional()
  @IsEnum(Country)
  country?: Country;

  @Expose()
  @IsOptional()
  @IsString()
  address?: string;

  @Expose()
  @IsOptional()
  @IsString()
  address2?: string;

  @Expose()
  @IsOptional()
  @IsString()
  city?: string;

  @Expose()
  @IsOptional()
  @ValidateIf((o) => o.country === Country.US)
  @IsUsState()
  @ValidateIf((o) => o.country === Country.CA)
  @IsCaState()
  state?: string;

  @Expose()
  @IsOptional()
  @IsPostalCode('US')
  zip?: string;

  @Expose()
  @IsOptional()
  @IsEnum(Country)
  mailingCountry?: Country;

  @Expose()
  @IsOptional()
  @IsString()
  mailingCity?: string;

  @Expose()
  @IsOptional()
  @ValidateIf((o) => o.mailingCountry === Country.US)
  @IsUsState()
  @ValidateIf((o) => o.mailingCountry === Country.CA)
  @IsCaState()
  mailingState?: string;

  @Expose()
  @IsOptional()
  @IsString()
  mailingAddress?: string;

  @Expose()
  @IsOptional()
  @IsString()
  mailingAddress2?: string;

  @Expose()
  @IsOptional()
  @IsPostalCode('US')
  mailingZip?: string;

  @Expose()
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  noaEmails?: string[];

  @Expose()
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  invoiceDeliveryEmails?: string[];

  @Expose()
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  payStatusEmails?: string[];
}
