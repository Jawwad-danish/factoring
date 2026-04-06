import { ClientSummaryRequest, ReportType } from '@fs-bobtail/factoring/data';

export const buildStubClientSummaryRequest = (
  data?: Partial<ClientSummaryRequest>,
): ClientSummaryRequest => {
  const request = new ClientSummaryRequest({
    outputType: ReportType.CSV,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  });
  Object.assign(request, data);
  return request;
};
