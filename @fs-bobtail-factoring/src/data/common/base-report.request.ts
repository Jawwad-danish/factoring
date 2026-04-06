import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";
import { Expose } from "class-transformer";
import { BaseModel } from "./base.model";
import { ReportName } from "../reports/report-name";

export enum ReportType {
  CSV = "csv",
  EXCEL = "excel",
  PDF = "pdf",
}

export class BaseReportCreateRequest<T> extends BaseModel<T> {
  @Expose()
  @IsNotEmpty()
  @IsEnum(ReportName)
  name!: ReportName;

  @Expose()
  @IsNotEmpty()
  @IsEnum(ReportType)
  outputType!: ReportType;

  @Expose()
  @IsNotEmpty()
  @IsEmail()
  sendTo!: string;
}
