import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BrokerRole } from '../model';

export class CreateBrokerContactRequest {
  @ApiProperty({ description: 'The name of contact.' })
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'The phone number of contact.' })
  @Expose()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'The email of contact.' })
  @Expose()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The phone country code of contact.' })
  @Expose()
  @IsString()
  countryPhoneCode: string;

  @ApiProperty({
    description: 'Contact role.',
    enum: BrokerRole,
  })
  @Expose()
  @IsEnum(BrokerRole)
  role: BrokerRole;

  @ApiProperty({ description: 'Mark as primary contact.' })
  @Expose()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  createdBy?: string;
}
