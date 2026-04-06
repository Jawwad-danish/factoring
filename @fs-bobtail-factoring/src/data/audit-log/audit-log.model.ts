import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { AuditBaseModel } from "../common";

export enum AuditLogType {
  BrokerPayment = "broker_payment",
  Quickbooks = "quickbooks",
}

export class AuditLog extends AuditBaseModel<AuditLog> {
  @Expose()
  @ApiProperty({
    title: "Audit log ID",
    description: "Audit log ID",
    format: "uuid",
  })
  id!: string;

  @Expose()
  @ApiProperty({
    title: "Audit log type",
    description: "Audit log type",
    enum: AuditLogType,
  })
  type!: AuditLogType;

  @Expose()
  @ApiProperty({
    title: "Audit log notes",
    description: "Audit log notes",
  })
  notes!: string[];

  @Expose()
  @ApiProperty({
    title: "Audit log payload",
    description: "Audit log payload",
    format: "json",
  })
  payload!: object;
}
