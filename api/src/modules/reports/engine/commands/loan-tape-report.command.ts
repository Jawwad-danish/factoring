import { LoanTapeReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class LoanTapeReportCommand extends ReportCommand<LoanTapeReportRequest> {
  constructor(request: LoanTapeReportRequest) {
    super(request, 'Loan Tape');
  }
}
