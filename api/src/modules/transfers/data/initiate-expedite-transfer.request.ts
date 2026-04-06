import { V1AwareBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiateExpediteTransferRequest extends V1AwareBaseModel<InitiateExpediteTransferRequest> {
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

  @Expose()
  @IsString()
  @ApiProperty({
    title: 'Client ID',
    description:
      'ID of the client for which the expedite transfer will be initiated',
    required: true,
    format: 'uuid',
  })
  clientId: string;
}
