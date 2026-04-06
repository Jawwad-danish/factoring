import {
  ClientAccountSummaryReportRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';

export const buildStubClientAccountSummaryRequest = (
  data?: Partial<ClientAccountSummaryReportRequest>,
): ClientAccountSummaryReportRequest => {
  const request = new ClientAccountSummaryReportRequest({
    outputType: ReportType.CSV,
    date: new Date('2025-01-31'),
  });
  Object.assign(request, data);
  return request;
};
