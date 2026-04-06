import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class SendNoaBombRequest {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    format: 'uuid',
  })
  clientId: string;
}
