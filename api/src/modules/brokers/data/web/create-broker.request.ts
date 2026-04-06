import { IsCaState, IsUsState } from '@core/decorators';
import { Expose, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsPostalCode,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { AuthorityStatus } from '../model';

export enum BobtailStatus {
  Active = 'active',
  Inactive = 'inactive',
  Sandbox = 'sandbox',
}

export enum Rating {
  DEFAULT = '--',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
  X = 'X',
}

export enum Country {
  US = 'US',
  CA = 'CA',
}

export class CreateBrokerRequest {
  @Expose()
  @IsString()
  businessName: string;

  @Expose()
  @IsOptional()
  @IsString()
  doingBusinessAs?: string;

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
  @IsDate()
  @Type(() => Date)
  authorityDate: Date;

  @Expose()
  @IsNotEmpty()
  @IsEnum(AuthorityStatus)
  authorityStatus: AuthorityStatus;

  @Expose()
  @IsNotEmpty()
  @IsString()
  city: string;

  @Expose()
  @IsOptional()
  @IsString()
  mc?: string;

  @Expose()
  @IsString()
  dot: string;

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
  @IsNotEmpty()
  @IsPhoneNumber('US')
  phoneNumber: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(BobtailStatus)
  bobtailStatus: BobtailStatus;

  @Expose()
  @IsNotEmpty()
  @IsEnum(Rating)
  rating: Rating;

  @Expose()
  @IsNotEmpty()
  @IsEnum(Rating)
  externalRating: Rating;

  @Expose()
  @IsNotEmpty()
  ratingReason: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  portalUrl?: string;

  // Delivery requirements -> TagDefinitions
  @Expose()
  @IsOptional()
  @IsBoolean()
  requireOriginals?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  requireCopies?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  requireOnlineSubmit?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  requireFax?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  requireEmail?: boolean;

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
