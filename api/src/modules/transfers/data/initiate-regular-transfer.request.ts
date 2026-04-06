import { V1AwareBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class InitiateRegularTransferRequest extends V1AwareBaseModel<InitiateRegularTransferRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Client batch payment ID',
    description:
      'When we want to create a client batch payment with a certain ID',
    required: false,
    format: 'uuid',
  })
  id?: string;
}
