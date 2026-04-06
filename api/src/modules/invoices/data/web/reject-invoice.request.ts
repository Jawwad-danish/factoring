import { V1AwareBaseModel } from '@core/data';
import {
  INVOICE_REJECTED_REASON_TAGS,
  InvoiceRejectedReasonTagsType,
} from '@module-persistence';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class RejectInvoiceRequest extends V1AwareBaseModel<RejectInvoiceRequest> {
  @IsOptional()
  @IsString()
  @ApiProperty({
    title: 'Rejection note',
    description: 'Invoice rejection note',
    required: false,
  })
  note?: string;

  @IsString()
  @ApiProperty({
    title: 'Rejection key',
    description: 'Invoice rejection key used to define the reason',
    enum: INVOICE_REJECTED_REASON_TAGS,
  })
  @IsIn(INVOICE_REJECTED_REASON_TAGS)
  key: InvoiceRejectedReasonTagsType;

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
    description: 'The message to be sent to the client regarding the rejection',
    type: 'string',
    required: false,
  })
  notificationMessage?: string;
}
