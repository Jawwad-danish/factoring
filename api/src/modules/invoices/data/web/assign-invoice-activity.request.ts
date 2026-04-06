import { V1AwareBaseModel } from '@core/data';
import { JSONObject } from '@core/types';
import { UUID } from '@core/uuid';
import { TagDefinitionKey } from '@module-persistence/entities';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class AssignInvoiceActivityRequest extends V1AwareBaseModel<AssignInvoiceActivityRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Invoice activity ID',
    description: 'When we want to create an invoice activity with a certain ID',
    required: false,
    format: 'uuid',
  })
  id: string = UUID.get();

  @IsEnum(TagDefinitionKey)
  @ApiProperty({
    title: 'Tag key',
    description: 'The tag key used for tagging the invoice',
    enum: TagDefinitionKey,
  })
  key: TagDefinitionKey;

  @IsString()
  @IsOptional()
  @ApiProperty({
    title: 'Tag note',
    description: 'Invoice tag note',
    required: false,
  })
  note?: string;

  @IsOptional()
  @ApiPropertyOptional({
    title: 'Tag payload',
    description:
      'The payload that will contain additional data about the decision of tagging the invoice',
    type: 'object',
    additionalProperties: true,
  })
  payload?: JSONObject;

  @IsOptional()
  @ApiProperty({
    title: 'Notify client',
    description:
      'Whether the client should be notified that the invoice was tagged',
    type: 'boolean',
    required: false,
  })
  notifyClient?: boolean;

  @ValidateIf((obj) => obj.notifyClient === true)
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    title: 'Notification Message',
    description:
      'The message to be sent to the client regarding the invoice tagging',
    type: 'string',
    required: false,
  })
  notificationMessage?: string;
}
