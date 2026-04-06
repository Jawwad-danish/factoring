import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEnum, IsUUID } from "class-validator";
import { V1AwareBaseModel } from "../common";
import { ClientBrokerAssignmentStatus } from "./client-broker-assignment-status";

export class CreateClientDebtorAssignmentRequest extends V1AwareBaseModel<CreateClientDebtorAssignmentRequest> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Client ID",
    description: "The ID of a Client",
    format: "uuid",
  })
  clientId!: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    title: "Broker ID",
    description: "The ID of a Broker",
    format: "uuid",
  })
  brokerId!: string;

  @IsEnum(ClientBrokerAssignmentStatus)
  @Expose()
  @ApiProperty({
    title: "Status",
    description: "The Status of a Client Broker Assignment",
    enum: Object.values(ClientBrokerAssignmentStatus),
  })
  status!: ClientBrokerAssignmentStatus;
}
