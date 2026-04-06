import { DetailedAgingReportCreateRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class DetailedAgingReportCommand extends ReportCommand<DetailedAgingReportCreateRequest> {
  constructor(request: DetailedAgingReportCreateRequest) {
    super(request, 'Detailed Aging');
  }
}
