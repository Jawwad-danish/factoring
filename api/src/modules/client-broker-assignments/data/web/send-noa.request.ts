import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsUUID } from 'class-validator';
import { V1AwareBaseModel } from '@core/data';

export class SendNoaRequest extends V1AwareBaseModel<SendNoaRequest> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Assignment ID',
    description: 'The ID of a Client Debtor Assignment',
    format: 'uuid',
  })
  id: string;

  @IsEmail()
  @Expose()
  @ApiProperty({
    title: 'Email',
    description: 'The email of a debtor',
  })
  to: string;
}
