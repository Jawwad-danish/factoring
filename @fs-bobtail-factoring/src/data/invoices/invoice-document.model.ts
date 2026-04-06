import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AuditBaseModel } from '../common';
import { Invoice } from './invoice.model';
import { InvoiceDocumentType } from './invoice-document-type.enum';
import { InvoiceDocumentLabel } from './invoice-document-label.enum';

export class LiteInvoiceDocument extends AuditBaseModel<LiteInvoiceDocument> {
  @IsUUID()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Invoice document ID',
    description: 'The invoice document ID',
  })
  id?: string;

  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Invoice document name',
    description: 'The invoice document name',
  })
  name!: string;

  @IsEnum(InvoiceDocumentType)
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Invoice document type',
    description: 'The invoice document type',
    enum: InvoiceDocumentType,
  })
  type!: InvoiceDocumentType;

  @IsUrl()
  @Expose()
  @ApiProperty({
    title: 'Invoice document internal URL',
    description: 'The invoice document internal URL. This is an S3 URL.',
  })
  internalUrl!: string;

  @IsUrl()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Invoice document external URL',
    description: 'The invoice document external URL. This is an Filestack URL.',
  })
  externalUrl!: string;

  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Invoice document label',
    description: 'The invoice document label',
  })
  label!: InvoiceDocumentLabel;
}

export class InvoiceDocument extends LiteInvoiceDocument {
  @IsUrl()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Invoice document thumbnail URL',
    description: 'The invoice document thumbnail URL. This is an mobile URL.',
  })
  thumbnailUrl!: string;

  @IsOptional()
  @Exclude()
  fileHash?: null | string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Invoice)
  @Expose()
  invoice?: Invoice;
}
