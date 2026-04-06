import { BatchReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class BatchReportCommand extends ReportCommand<BatchReportRequest> {
  constructor(request: BatchReportRequest) {
    super(request, 'Batch');
  }
}
