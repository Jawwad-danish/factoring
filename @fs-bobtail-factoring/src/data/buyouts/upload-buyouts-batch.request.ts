import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransformToBig } from '../../validators';
import { BaseModel } from '../common';

export class UploadBuyoutsBatchRequest extends BaseModel<UploadBuyoutsBatchRequest> {
  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Name',
    description: 'The batch name',
    required: false,
  })
  name?: string;

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
  @TransformToBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Client payable fee',
    description: 'The client payable fee',
    required: false,
    type: 'string',
    pattern: '[0-9]+',
  })
  clientPayableFee?: Big;

  @IsOptional()
  @TransformToBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Bobtail payable fee',
    description: 'The bobtail payable fee',
    required: false,
    type: 'string',
    pattern: '[0-9]+',
  })
  bobtailPayableFee?: Big;
}
