import { ApiProperty } from "@nestjs/swagger";
import Big from "big.js";
import { Expose, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from "class-validator";
import {
  IsBigRange,
  ProductionOnly,
  TransformFromBig,
  TransformToBig,
} from "../../validators";
import { V1AwareBaseModel } from "../common";
import { CreateInvoiceDocumentsRequest } from "./create-invoice-documents.request";

export class CreateInvoiceRequest extends V1AwareBaseModel<CreateInvoiceRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Invoice ID",
    description: "When we want to create an invoice with a certain ID",
    required: false,
    format: "uuid",
  })
  id?: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Client ID",
    description: "The ID of a Client",
    format: "uuid",
  })
  clientId!: string;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Buyout ID",
    description: "The ID of a Buyout linked to this invoice",
    format: "uuid",
  })
  buyoutId!: string;

  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Broker ID",
    description: "The ID of a Broker",
    format: "uuid",
  })
  brokerId!: null | string;

  @IsString()
  @Expose()
  @ApiProperty({
    title: "Invoice display ID",
    description: "The display ID of the invoice",
  })
  displayId!: string;

  @IsString()
  @Length(1, 120)
  @Expose()
  @ApiProperty({
    title: "Invoice load number",
    description: "The load number of the invoice",
  })
  loadNumber!: string;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: "Invoice line haul rate",
    description:
      "This is the value of the invoice i.e. the agreed amount between the Client and Broker. The amount is in pennies.",
    type: "string",
    pattern: "[0-9]+",
    example: "1200",
  })
  lineHaulRate!: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: "Invoice lumper",
    description:
      "The amount paid by the Client to unload heavy material. The amount is in pennies.",
    type: "string",
    pattern: "[0-9]+",
    default: "0",
    required: false,
    example: "100",
  })
  lumper!: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: "Invoice detention",
    description:
      "Any fee which the Client has to pay while moving the load and is not accounted for in the Line Haul Rate e.g. waiting fee. The amount is in pennies.",
    type: "string",
    pattern: "[0-9]+",
    default: "0",
    required: false,
    example: "100",
  })
  detention!: Big;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: "Invoice advance",
    description:
      "Any amount which the Client has taken in advance from the Broker from the agreed Invoice amount before moving a load. The amount is in pennies.",
    type: "string",
    pattern: "[0-9]+",
    default: "0",
    required: false,
    example: "100",
  })
  advance!: Big;

  @IsOptional()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: "Invoice approved factor fee",
    description: "The invoice factor fee",
    type: "string",
    pattern: "[0-9]+",
    default: "0",
    required: false,
    example: "1",
  })
  approvedFactorFee!: Big;

  @IsOptional()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: "Invoice approved factor fee percentage",
    description: "The invoice factor fee percentage",
    type: "string",
    pattern: "[0-9]+",
    default: "0",
    required: false,
    example: "1",
  })
  approvedFactorFeePercentage!: Big;

  @IsBoolean()
  @Expose()
  @ApiProperty({
    title: "Invoice expedited",
    description: "The invoice expedited (T/F)",
  })
  expedited!: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  @ApiProperty({
    title: "Invoice notes",
    description: "Invoice notes for the processing team",
    required: false,
    maximum: 255,
    example: "Invoice note",
  })
  note?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  @ApiProperty({
    title: "Invoice memo",
    description: "Invoice internal client memo",
    required: false,
    maximum: 255,
    example: "Invoice memo",
  })
  memo!: string;

  @IsArray()
  @ProductionOnly(ArrayNotEmpty)
  @ValidateNested()
  @Type(() => CreateInvoiceDocumentsRequest)
  @Expose()
  @ApiProperty({
    title: "Invoice documents",
    description: "The invoice documents",
    type: [CreateInvoiceDocumentsRequest],
  })
  documents!: CreateInvoiceDocumentsRequest[];

  constructor(source?: Partial<CreateInvoiceRequest>) {
    super(source);

    this.brokerId ??= null;
    this.lumper ??= Big(0);
    this.detention ??= Big(0);
    this.advance ??= Big(0);
    this.approvedFactorFee ??= Big(0);
    this.approvedFactorFeePercentage ??= Big(0);
    this.documents ??= [];
  }
}
