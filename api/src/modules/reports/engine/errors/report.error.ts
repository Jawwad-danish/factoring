import { CauseAwareError } from '@core/errors';

export class ReportError extends CauseAwareError {
  constructor(reportName: string, cause: Error) {
    super('report-error', `Failed to run report ${reportName}`, cause);
  }

  static fromMessage(reportName: string, message: string) {
    return new ReportError(reportName, new Error(message));
  }
}
