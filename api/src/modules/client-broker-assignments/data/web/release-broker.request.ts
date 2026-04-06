import { V1AwareBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class ReleaseBrokerRequest extends V1AwareBaseModel<ReleaseBrokerRequest> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    format: 'uuid',
  })
  clientId: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Broker ID',
    description: 'The ID of a Broker',
    format: 'uuid',
  })
  brokerId: string;
}
