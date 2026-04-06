import { BaseModel } from '@core/data';
import { Expose, Type } from 'class-transformer';

export enum ApiClientContactType {
  OWNER = 'owner',
  DRIVER = 'driver',
  CONTACT = 'contact',
  BUSINESS = 'business',
  OFFICIAL = 'official',
}

export enum ApiPhoneType {
  Mobile = 'mobile',
  Landline = 'landline',
  Voip = 'voip',
}

export class ApiContactAddress extends BaseModel<ApiContactAddress> {
  @Expose()
  country: string;

  @Expose()
  state: string;

  @Expose()
  city: string;

  @Expose()
  zip: string;

  @Expose()
  address: string;
}

export class ApiContactPhone extends BaseModel<ApiContactPhone> {
  @Expose()
  phoneType?: ApiPhoneType;

  @Expose()
  phone: string;
}

export class ApiCreateClientContact extends BaseModel<ApiCreateClientContact> {
  @Expose()
  type?: ApiClientContactType;

  @Expose()
  primary: boolean;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  notifications: boolean;

  @Expose()
  @Type(() => ApiContactAddress)
  address: ApiContactAddress;

  @Expose()
  @Type(() => ApiContactPhone)
  contactPhones: ApiContactPhone[];
}

export class ApiCreateClientRequest extends BaseModel<ApiCreateClientRequest> {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  shortName: string;

  @Expose()
  mc?: string;

  @Expose()
  dot: string;

  @Expose()
  ein?: string;

  @Expose()
  doingBusinessAs?: string;

  @Expose()
  corporationType?: string;

  @Expose()
  @Type(() => ApiCreateClientContact)
  clientContacts: ApiCreateClientContact[];

  @Expose()
  languages?: string[];

  @Expose()
  @Type(() => Date)
  authorityDate?: Date;
}
