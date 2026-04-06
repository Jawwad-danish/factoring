import { ApiProperty } from "@nestjs/swagger";
import Big from "big.js";
import { Exclude, Expose, Type } from "class-transformer";
import { TransformFromBig, TransformToBig } from "../../validators";
import { BaseModel } from "../common";

@Exclude()
export class ReserveTotal extends BaseModel<ReserveTotal> {
  @Expose()
  @TransformFromBig()
  @TransformToBig()
  @Type(() => String)
  @ApiProperty({
    title: "Reserve total",
    description: "The reserve total",
    type: "string",
    pattern: "[0-9]+",
    example: "1000",
  })
  amount: Big;
}
