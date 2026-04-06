import { PortfolioReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class PortfolioReportCommand extends ReportCommand<PortfolioReportRequest> {
  constructor(request: PortfolioReportRequest) {
    super(request, 'Portfolio');
  }
}
