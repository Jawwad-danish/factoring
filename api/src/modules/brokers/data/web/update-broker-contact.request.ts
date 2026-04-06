import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { BrokerRole } from '../model';

export class UpdateBrokerContactRequest {
  @ApiProperty({ description: 'The name of contact.' })
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'The phone number of contact.' })
  @Expose()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'The email of contact.' })
  @Expose()
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Contact role.',
    enum: BrokerRole,
  })
  @Expose()
  @IsOptional()
  @IsEnum(BrokerRole)
  role?: BrokerRole;

  @ApiProperty({ description: 'Mark as primary contact.' })
  @Expose()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @Expose()
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
