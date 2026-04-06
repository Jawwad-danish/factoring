import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEnum, IsOptional, IsString, IsUUID, IsUrl } from "class-validator";
import { BaseModel } from "../common";
import { InvoiceDocumentType } from "./invoice-document-type.enum";
import { InvoiceDocumentLabel } from "./invoice-document-label.enum";

export class CreateInvoiceDocumentsRequest extends BaseModel<CreateInvoiceDocumentsRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Invoice document ID",
    description: "When we want to create an invoice document with a certain ID",
    required: false,
    format: "uuid",
  })
  id?: string;

  @IsString()
  @Expose()
  @ApiProperty({
    title: "Invoice document name",
    description: "The invoice document name",
    example: "image.png",
  })
  name!: string;

  @IsEnum(InvoiceDocumentType)
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: "Invoice document type",
    description: "The invoice document type",
    enum: InvoiceDocumentType,
  })
  type!: InvoiceDocumentType;

  @IsUrl()
  @Expose()
  @ApiProperty({
    title: "Invoice document internal URL",
    description: "The invoice document internal URL. This is an S3 URL.",
  })
  internalUrl!: string;

  @IsUrl()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: "Invoice document external URL",
    description: "The invoice document external URL. This is an Filestack URL.",
  })
  externalUrl!: string;

  @IsUrl()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: "Invoice document thumbnail URL",
    description: "The invoice document thumbnail URL. This is an mobile URL.",
  })
  thumbnailUrl!: string;

  @IsString()
  @Expose()
  @IsEnum(InvoiceDocumentLabel)
  @ApiProperty({
    title: "Invoice document label",
    description: "The invoice document label",
  })
  label!: InvoiceDocumentLabel;

  constructor(source?: Partial<CreateInvoiceDocumentsRequest>) {
    super(source);

    this.type ??= InvoiceDocumentType.Uploaded;
  }
}
