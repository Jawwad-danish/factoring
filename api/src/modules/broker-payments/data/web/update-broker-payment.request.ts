import { V1AwareBaseModel } from '@core/data';
import { BrokerPaymentType } from '@module-persistence/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsString, ValidateIf } from 'class-validator';

export class UpdateBrokerPaymentRequest extends V1AwareBaseModel<UpdateBrokerPaymentRequest> {
  @IsEnum(BrokerPaymentType)
  @Expose()
  type: BrokerPaymentType;

  @Expose()
  @IsString()
  @ValidateIf((request) => {
    return request.type === BrokerPaymentType.Check;
  })
  @ApiProperty({
    title: 'Broker payment check number',
    description: 'The broker payment check number',
    required: false,
  })
  checkNumber?: string;

  @IsDate()
  @Type(() => Date)
  @Expose()
  @ApiProperty({
    title: 'Broker payment batch date',
    description: 'The broker payment batch date',
  })
  batchDate: Date;
}
