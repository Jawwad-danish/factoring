import { Rating } from '@module-brokers/data';
import { Expose, Type } from 'class-transformer';
import { IsUrl } from 'class-validator';
import {
  AddressType,
  BrokerAddressCreate,
  BrokerEmailCreate,
  EmailType,
} from './api-create-broker-request';
import { BaseModel } from '@core/data';

export class BrokerEmailUpdate extends BaseModel<BrokerEmailCreate> {
  @Expose()
  email: string;

  @Expose()
  type: EmailType;
}

export class BrokerAddressUpdate extends BaseModel<BrokerAddressUpdate> {
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
}

export class BrokerUpdateApiRequest extends BaseModel<BrokerUpdateApiRequest> {
  @Expose()
  legalName?: string;

  @Expose()
  mc?: string;

  @Expose()
  dot?: string;

  @Expose()
  doingBusinessAs?: string;

  @Expose()
  phone?: string;

  @Expose()
  authorityDate?: Date;

  @Expose()
  status?: string;

  @Expose()
  rating?: Rating;

  @Expose()
  externalRating?: string;

  @Expose()
  ratingReason?: string;

  @Expose()
  @IsUrl()
  portalUrl?: string;

  @Expose()
  createdBy?: string;

  @Expose()
  @Type(() => BrokerAddressCreate)
  addresses?: BrokerAddressUpdate[];

  @Expose()
  @Type(() => BrokerEmailCreate)
  emails?: BrokerEmailUpdate[];

  @Expose()
  updatedBy: string;
}
