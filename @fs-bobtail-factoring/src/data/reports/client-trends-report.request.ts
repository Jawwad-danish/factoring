import { BaseReportCreateRequest } from "../common";
import { Expose } from "class-transformer";
import { IsOptional, IsUUID } from "class-validator";
import { ReportName } from "./report-name";

export class ClientTrendsReportCreateRequest extends BaseReportCreateRequest<ClientTrendsReportCreateRequest> {
  constructor(source?: Partial<ClientTrendsReportCreateRequest>) {
    super(source);
    this.name = ReportName.ClientTrends;
  }

  @Expose()
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
