import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IsBigRange, TransformFromBig, TransformToBig } from '../../validators';
import { BaseModel, V1AwareBaseModel } from '../common';

export class CreateBuyoutsRequest extends BaseModel<CreateBuyoutsRequest> {
  @Expose()
  @IsOptional()
  @IsString()
  @ApiProperty({
    title: 'Buyout ID',
    description: 'Optional buyout ID',
    required: false,
  })
  id?: string;

  @Expose()
  @IsString()
  @ApiProperty({
    title: 'Broker name',
    description: 'The broker name',
  })
  brokerName!: string;

  @Expose()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    title: 'Buyout date',
    description: 'The buyout date',
  })
  buyoutDate!: Date;

  @Expose()
  @IsUUID()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    format: 'uuid',
  })
  clientId!: string;

  @Expose()
  @IsString()
  @ApiProperty({
    title: 'Load number',
    description: 'The buyout load number',
  })
  loadNumber!: string;

  @Expose()
  @IsString()
  @ApiProperty({
    title: 'MC',
    description: 'The broker MC number',
  })
  mc!: string;

  @Expose()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0 })
  @ApiProperty({
    title: 'Rate',
    description: 'The buyout rate',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  rate!: Big;
}

export class CreateBuyoutsBatchRequest extends V1AwareBaseModel<CreateBuyoutsBatchRequest> {
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBuyoutsRequest)
  @ApiProperty({
    title: 'Batch',
    description: 'The batch of buyout requests',
    type: [CreateBuyoutsRequest],
  })
  batch!: CreateBuyoutsRequest[];
}
