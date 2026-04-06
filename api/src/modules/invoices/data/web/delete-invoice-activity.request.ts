import { V1AwareBaseModel } from '@core/data';
import { TagDefinitionKey } from '@module-persistence';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteInvoiceActivityRequest extends V1AwareBaseModel<DeleteInvoiceActivityRequest> {
  @IsString()
  @IsOptional()
  @ApiProperty({
    title: 'Notes',
    description: 'Notes to be added to the deleted invoice activity',
    required: true,
  })
  note?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    title: 'Key',
    description:
      'Activity Log Key to delete the invoice activity. Needed in case of missmatching the ids of v1 and v2',
    required: false,
  })
  key?: TagDefinitionKey;
}
