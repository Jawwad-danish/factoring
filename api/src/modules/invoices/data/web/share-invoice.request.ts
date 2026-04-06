import { BaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ShareInvoiceRequest extends BaseModel<ShareInvoiceRequest> {
  @IsEmail({}, { each: true })
  @ApiProperty({
    title: 'Email addressess',
    description: 'The email addressess used to share the invoice document',
    required: true,
  })
  emails: string[];
}
