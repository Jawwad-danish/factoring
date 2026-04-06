import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { BaseModel } from './base.model';
import { RecordStatus } from './types';
import { User } from './user.model';

export abstract class AuditBaseModel<T> extends BaseModel<T> {
  @ValidateNested()
  @Type(() => User)
  @Expose()
  @ApiProperty({
    title: 'Created by',
    description: 'Who created this entry',
  })
  createdBy!: null | User;

  @IsDateString()
  @Expose()
  @Type(() => Date)
  @ApiProperty({
    title: 'Created at',
    description: 'When this entry was created',
  })
  createdAt!: Date;

  @ValidateNested()
  @Type(() => User)
  @Expose()
  @ApiProperty({
    title: 'Updated by',
    description: 'Who was the last to update this entry',
  })
  updatedBy!: null | User;

  @IsDateString()
  @Expose()
  @Type(() => Date)
  @ApiProperty({
    title: 'Updated at',
    description: 'When was this entry last updated',
  })
  updatedAt!: Date;

  @IsEnum(RecordStatus)
  @IsOptional()
  recordStatus?: RecordStatus;
}
