import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformFromBig, TransformToBig } from '../../validators';
import { AuditBaseModel } from '../common';

export class PendingBuyout extends AuditBaseModel<PendingBuyout> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Pending buyout ID',
    description: 'The pending buyout ID',
    format: 'uuid',
  })
  id!: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Load number',
    description: 'The buyout load number',
  })
  loadNumber!: string;

  @IsNotEmpty()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    format: 'uuid',
  })
  clientId!: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Broker name',
    description: 'The broker name',
    required: false,
  })
  brokerName?: string;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Broker MC',
    description: 'The broker MC number',
    required: false,
  })
  brokerMC?: string;

  @IsNotEmpty()
  @IsDateString()
  @Expose()
  @ApiProperty({
    title: 'Payment date',
    description: 'The buyout payment date',
  })
  paymentDate!: Date;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Rate',
    description: 'The buyout rate',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  rate: Big = Big(0);
}
