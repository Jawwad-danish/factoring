import {
  ClientListReportRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';

export const buildStubClientListRequest = (
  data?: Partial<ClientListReportRequest>,
): ClientListReportRequest => {
  const request = new ClientListReportRequest({
    outputType: ReportType.CSV,
    endDate: new Date('2025-01-31'),
  });
  Object.assign(request, data);
  return request;
};
