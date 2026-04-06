import { AuditBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsBoolean,
  IsEmail,
  IsString,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ClientContactAddress } from './client-contact-address.model';
import { ClientContactPhone } from './client-contact-phone.model';

export enum ClientContactType {
  OWNER = 'owner',
  DRIVER = 'driver',
  CONTACT = 'contact',
  BUSINESS = 'business',
  OFFICIAL = 'official',
}

export class ClientContact extends AuditBaseModel<ClientContact> {
  @Expose()
  @ApiProperty({
    required: false,
  })
  id: string;

  @Expose()
  @IsEnum(ClientContactType)
  @ApiProperty({
    enum: ClientContactType,
    name: 'ClientContactType',
  })
  type: ClientContactType;

  @Expose()
  @IsBoolean()
  @ApiProperty()
  primary: boolean;

  @Expose()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @Expose()
  @IsBoolean()
  @ApiProperty()
  notifications: boolean;

  @Expose()
  @IsObject()
  @Type(() => ClientContactAddress)
  @ValidateNested()
  @ApiProperty()
  address: ClientContactAddress;

  @Expose()
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => ClientContactPhone)
  @ValidateNested()
  @ApiProperty({
    type: ClientContactPhone,
    isArray: true,
  })
  contactPhones: ClientContactPhone[];

  getPhoneNumber(): string | undefined {
    return this.contactPhones?.[0]?.phone;
  }

  getAddress(): string | undefined {
    return this.address?.address;
  }

  getCity(): string | undefined {
    return this.address?.city;
  }

  getState(): string | undefined {
    return this.address?.state;
  }

  getZipcode(): string | undefined {
    return this.address?.zip;
  }
}
