import {
  DetailedAgingReportCreateRequest,
  ReportType,
} from '@fs-bobtail/factoring/data';
import { RawDetailedAgingData } from '../engine/data-access-types';
import { InvoiceEntitySchema } from '@module-persistence/entities';

export const buildStubDetailedAgingRequest = (
  data?: Partial<DetailedAgingReportCreateRequest>,
): DetailedAgingReportCreateRequest => {
  const request = new DetailedAgingReportCreateRequest({
    outputType: ReportType.CSV,
    date: new Date('2026-03-01'),
  });
  Object.assign(request, data);
  return request;
};

export const buildStubRawDetailedAgingData = (
  data?: Partial<RawDetailedAgingData>,
): RawDetailedAgingData => {
  const defaultData = {
    client_id: 'client-1',
    broker_id: 'broker-1',
    [InvoiceEntitySchema.COLUMN_PURCHASED_DATE]: '2026-03-01T10:00:00Z',
    [InvoiceEntitySchema.COLUMN_LOAD_NUMBER]: 'LOAD123',
    [InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE]: '1000.00',
    [InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE]: '50.00',
    [InvoiceEntitySchema.COLUMN_DEDUCTION]: '10.00',
    [InvoiceEntitySchema.COLUMN_RESERVE_FEE]: '20.00',
  } as unknown as RawDetailedAgingData;
  return { ...defaultData, ...data } as unknown as RawDetailedAgingData;
};
