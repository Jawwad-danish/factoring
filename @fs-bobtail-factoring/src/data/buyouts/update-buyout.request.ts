import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { IsBigRange, TransformFromBig, TransformToBig } from '../../validators';
import { V1AwareBaseModel } from '../common';

@Exclude()
export class UpdateBuyoutRequest extends V1AwareBaseModel<UpdateBuyoutRequest> {
  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Load number',
    description: 'Buyout load number',
    required: false,
  })
  loadNumber?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Expose()
  @ApiProperty({
    title: 'Payment date',
    description: 'Buyout payment date',
    required: false,
  })
  paymentDate?: Date;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0 })
  @Expose()
  @ApiProperty({
    title: 'Rate',
    description: 'Buyout rate',
    required: false,
  })
  rate?: Big;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Broker name',
    description: 'Broker name',
    required: false,
  })
  brokerName?: string;
}
