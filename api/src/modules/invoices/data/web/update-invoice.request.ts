import { V1AwareBaseModel } from '@core/data';
import { IsBigRange, TransformFromBig, TransformToBig } from '@core/decorators';
import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { CreateInvoiceDocumentsRequest } from './create-invoice-documents.request';
import { UpdateInvoiceDocumentLabelRequest } from './update-invoice-documents.request';

export class UpdateInvoiceDocuments {
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateInvoiceDocumentsRequest)
  @Expose()
  @ApiProperty({
    title: 'Invoice document to create',
    description: 'When we want to add new invoice documents',
    required: false,
  })
  toAdd: CreateInvoiceDocumentsRequest[] = [];

  @IsOptional()
  @Expose()
  @IsArray()
  @ApiProperty({
    title: 'Invoice document IDs to remove',
    description:
      'List of existing invoice document IDs that we want to remove from the invoice',
    required: false,
    type: 'string',
    isArray: true,
  })
  toDelete: string[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateInvoiceDocumentLabelRequest)
  @Expose()
  @ApiProperty({
    title: 'Invoice document to create',
    description: 'When we want to add new invoice documents',
    required: false,
  })
  toUpdate: UpdateInvoiceDocumentLabelRequest[] = [];
}
export class UpdateInvoiceRequest extends V1AwareBaseModel<UpdateInvoiceRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    required: false,
  })
  clientId?: string;

  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Broker ID',
    description: 'The ID of a Broker',
    required: false,
    nullable: true,
  })
  brokerId?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Expose()
  @ApiProperty({
    title: 'Invoice load number',
    description: 'The invoice load number',
    required: false,
  })
  loadNumber?: string;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice line haul rate',
    description:
      'This is the value of the invoice i.e. the agreed amount between the Client and Broker.',
    type: 'string',
    pattern: '[0-9]+',
    required: false,
  })
  lineHaulRate?: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice lumper',
    description: 'The amount paid by the Client to unload heavy material.',
    type: 'string',
    pattern: '[0-9]+',
    required: false,
  })
  lumper?: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice detention',
    description:
      'Any fee which the Client has to pay while moving the load and is not accounted for in the Line Haul Rate e.g. waiting fee.',
    type: 'string',
    pattern: '[0-9]+',
    required: false,
  })
  detention?: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Invoice advance',
    description:
      'Any amount which the Client has taken in advance from the Broker from the agreed Invoice amount before moving a load.',
    type: 'string',
    pattern: '[0-9]+',
    required: false,
  })
  advance?: Big;

  @IsOptional()
  @IsBoolean()
  @Expose()
  @ApiProperty({
    title: 'Invoice payment expedited type',
    description: 'The invoice expedited type',
    required: false,
  })
  expedited?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose()
  @ApiProperty({
    title: 'Resend purchase email flag',
    description:
      'Flag that indicates if the purchase email should be resent to broker after edit',
    required: false,
  })
  resendEmail?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  @ApiProperty({
    title: 'Invoice notes',
    description: 'Invoice notes for the processing team',
    required: false,
    maximum: 255,
  })
  note?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  @ApiProperty({
    title: 'Invoice memo',
    description: 'Invoice internal client memo',
    required: false,
    maximum: 255,
  })
  memo?: string;

  @IsOptional()
  @Expose()
  @ValidateNested()
  @Type(() => UpdateInvoiceDocuments)
  @ApiProperty({
    title: 'Invoice documents',
    description: 'The invoice documents to update',
    type: [UpdateInvoiceDocuments],
  })
  documents?: UpdateInvoiceDocuments;
}
