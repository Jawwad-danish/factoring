import { ReportNotifier, ReportNotifyPayload } from './base.report-notifier';
import { Logger } from '@nestjs/common';

export class EmptyReportNotifier implements ReportNotifier {
  private readonly logger = new Logger(EmptyReportNotifier.name);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async notify(_payload: ReportNotifyPayload): Promise<void> {
    this.logger.log(
      'Notifying report ready notification is disabled in local or test environment',
    );
    return;
  }
}
