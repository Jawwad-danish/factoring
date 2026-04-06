import { AuditBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsPhoneNumber, IsEnum } from 'class-validator';

export enum PhoneType {
  MOBILE = 'mobile',
  LANDLINE = 'landline',
  VOIP = 'voip',
}

export class ClientContactPhone extends AuditBaseModel<ClientContactPhone> {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @IsPhoneNumber('US')
  @ApiProperty()
  phone: string;

  @Expose()
  @IsEnum(PhoneType)
  @ApiProperty({
    enum: PhoneType,
    enumName: 'PhoneType',
  })
  phoneType: PhoneType;
}
