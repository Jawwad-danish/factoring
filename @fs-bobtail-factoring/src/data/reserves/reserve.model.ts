import { ApiProperty } from "@nestjs/swagger";
import Big from "big.js";
import { Exclude, Expose, Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { TransformFromBig, TransformToBig } from "../../validators";
import { AuditBaseModel } from "../common";
import { ReserveReason } from "./reserve-reason";

@Exclude()
export class Reserve extends AuditBaseModel<Reserve> {
  @Expose()
  @ApiProperty({
    title: "Reserve ID",
    description: "The reserve ID",
    format: "uuid",
  })
  id!: string;

  @Expose()
  @ApiProperty({
    title: "Invoice ID",
    description: "Invoice ID associated with this reserve",
    format: "uuid",
  })
  invoiceId?: string;

  @Expose()
  @IsOptional()
  @ApiProperty({
    title: "Broker Payment ID",
    description: "Broker Payment ID associated with this reserve",
    format: "uuid",
  })
  brokerPaymentId?: string;

  @Expose()
  @IsOptional()
  @ApiProperty({
    title: "Client Payment IDs",
    description: "Client Payment IDs associated with this reserve",
    format: "uuid",
  })
  clientPaymentIds?: string[];

  @Expose()
  @ApiProperty({
    title: "Client ID",
    description: "The ID of a Client",
    format: "uuid",
  })
  clientId!: string;

  @TransformToBig()
  @Type(() => String)
  @ApiProperty({
    title: "Reserve value",
    description: "The reserve value",
    type: "string",
    pattern: "[0-9]+",
    example: "1000",
  })
  @Expose()
  amount: Big;

  @Expose()
  @ApiProperty({
    title: "Reserve reason",
    description: "The reserve reason",
    enum: ReserveReason,
  })
  reason!: ReserveReason;

  @Expose()
  @ApiProperty({
    title: "Reserve note",
    description: "The reserve note",
  })
  note!: string;

  @Expose()
  @ApiProperty({
    title: "Reserve payload",
    description: "The reserve payload",
    type: "object",
    additionalProperties: true,
  })
  payload!: object;

  @Expose()
  @TransformFromBig()
  @TransformToBig()
  @Type(() => String)
  @ApiProperty({
    title: "Reserve total",
    description: "Reserve total up until this reserve",
    type: "string",
    pattern: "[0-9]+",
    example: "1000",
  })
  total: Big;
}
