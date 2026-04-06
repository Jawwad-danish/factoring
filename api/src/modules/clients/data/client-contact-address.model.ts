import { AuditBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class ClientContactAddress extends AuditBaseModel<ClientContactAddress> {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  country: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  state: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  city: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  address: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  zip: string;
}
