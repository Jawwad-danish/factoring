import { BaseModel } from '@core/data';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { AuthorityStatus } from '../../data/model';
import { Rating } from '../../data/web';

export enum AddressType {
  Office = 'office',
  Mailing = 'mailing',
}

export enum Role {
  OWNER = 'owner',
  BROKER = 'broker',
  ACCOUNTING = 'accounting',
  SUPERVISOR = 'supervisor',
  OTHER = 'other',
}

export enum EmailType {
  NOA = 'NOA',
  PAYMENT_STATUS = 'payment_status',
  INVOICE_DELIVERY = 'invoice_delivery',
}

export class BrokerEmailCreate extends BaseModel<BrokerEmailCreate> {
  @Expose()
  email: string;

  @Expose()
  type: EmailType;

  @Expose()
  createdBy: string;
}

export class BrokerAddressCreate extends BaseModel<BrokerAddressCreate> {
  @Expose()
  type: AddressType;

  @Expose()
  country?: string;

  @Expose()
  state?: string;

  @Expose()
  city?: string;

  @Expose()
  zip?: string;

  @Expose()
  streetAddress?: string | null;

  @Expose()
  address?: string;

  createdBy: string;
}

export class BrokerCreateApiRequest extends BaseModel<BrokerCreateApiRequest> {
  @Expose()
  id: string;

  @Expose()
  legalName: string;

  @Expose()
  mc?: string;

  @Expose()
  dot: string;

  @Expose()
  doingBusinessAs?: string;

  @Expose()
  phone: string;

  @Expose()
  authorityDate: Date;

  @Expose()
  authorityStatus: AuthorityStatus;

  @Expose()
  status: string;

  @Expose()
  rating: Rating;

  @Expose()
  externalRating: string;

  @Expose()
  ratingReason: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  portalUrl?: string;

  @Expose()
  createdBy?: string;

  @Expose()
  @Type(() => BrokerAddressCreate)
  addresses: BrokerAddressCreate[];

  @Expose()
  @Type(() => BrokerEmailCreate)
  emails: BrokerEmailCreate[];

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
}
