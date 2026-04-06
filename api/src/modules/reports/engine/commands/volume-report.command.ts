import { VolumeReportRequest } from '@fs-bobtail/factoring/data';
import { ReportCommand } from './report.command';

export class VolumeReportCommand extends ReportCommand<VolumeReportRequest> {
  constructor(request: VolumeReportRequest) {
    super(request, 'Volume');
  }
}
