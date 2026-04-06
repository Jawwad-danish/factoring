import { RollForwardRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class RollForwardReportCommand extends ReportCommand<RollForwardRequest> {
  constructor(request: RollForwardRequest) {
    super(request, 'Roll forward');
  }
}
