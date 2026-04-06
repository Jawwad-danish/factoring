import { BaseModel } from '@core/data';
import {
  InvoiceDocumentLabel,
  InvoiceDocumentType,
} from '@module-persistence/entities';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class DocumentOptions extends BaseModel<DocumentOptions> {
  @IsBoolean()
  sendDocumentAfterProcessingFlag: boolean;
}

export class UpdateInvoiceDocumentRequest extends BaseModel<UpdateInvoiceDocumentRequest> {
  @IsUUID()
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @Expose()
  name: string;

  @IsEnum(InvoiceDocumentType)
  @IsOptional()
  @Expose()
  type: InvoiceDocumentType;

  @IsUrl()
  @Expose()
  internalUrl: string;

  @IsUrl()
  @IsOptional()
  @Expose()
  externalUrl: string;

  @IsUrl()
  @IsOptional()
  @Expose()
  thumbnailUrl: string;

  @ValidateNested()
  @Type(() => DocumentOptions)
  @Expose()
  @IsNotEmpty()
  options: DocumentOptions;
}

export class UpdateInvoiceDocumentLabelRequest extends BaseModel<UpdateInvoiceDocumentLabelRequest> {
  @IsUUID()
  @IsString()
  @Expose()
  id: string;

  @Expose()
  @IsString()
  label: InvoiceDocumentLabel;
}
