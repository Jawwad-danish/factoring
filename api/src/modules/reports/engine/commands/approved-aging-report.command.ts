import { ApprovedAgingReportCreateRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class ApprovedAgingReportCommand extends ReportCommand<ApprovedAgingReportCreateRequest> {
  constructor(request: ApprovedAgingReportCreateRequest) {
    super(request, 'Approved Aging');
  }
}
