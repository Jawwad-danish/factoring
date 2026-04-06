import {
  LoanTapeDateFilter,
  LoanTapeReportRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';

export const buildStubLoanTapeCreateRequest = (
  data?: Partial<LoanTapeReportRequest>,
) => {
  const request = new LoanTapeReportRequest({
    outputType: ReportType.CSV,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    dateFilter: LoanTapeDateFilter.PROCESSED_DATE,
    includeDeclinedInvoices: false,
    includePendingInvoices: false,
    includeInvoiceUpdates: false,
    includeLastUpdateDate: false,
  });
  Object.assign(request, data);
  return request;
};
