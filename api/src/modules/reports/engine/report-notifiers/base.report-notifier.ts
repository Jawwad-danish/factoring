export const REPORT_NOTIFIER = 'REPORT_NOTIFIER';

export interface ReportNotifyPayload {
  reportName: string;
  storageUrl: string;
  recipientEmail: string;
}

export interface ReportNotifier {
  notify(payload: ReportNotifyPayload): Promise<void>;
}
