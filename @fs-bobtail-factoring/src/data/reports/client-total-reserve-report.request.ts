import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class ClientTotalReserveReportCreateRequest extends BaseReportCreateRequest<ClientTotalReserveReportCreateRequest> {
  constructor(source?: Partial<ClientTotalReserveReportCreateRequest>) {
    super(source);
    this.name = ReportName.ClientTotalReserve;
  }
}
