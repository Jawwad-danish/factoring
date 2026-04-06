import { VolumeReportDataTransformer } from './volume-report.data-transformer';
import { LightweightClient } from '@module-clients/data';
import {
  RawClientFactoringConfigWithTeam,
  RawVolumeReportInvoiceData,
} from '../../../data-access-types';
import Big from 'big.js';
import { buildStubLightweightClient } from '@module-clients/test';

describe('VolumeReportDataTransformer', () => {
  let transformer: VolumeReportDataTransformer;
  let clientsMap: Map<string, LightweightClient>;
  let invoiceDataMap: Map<string, RawVolumeReportInvoiceData>;

  beforeEach(() => {
    clientsMap = new Map<string, LightweightClient>([
      [
        'client-1',
        buildStubLightweightClient({
          id: 'client-1',
          name: 'Test Client 1',
          mc: 'MC123',
          dot: 'DOT456',
        }),
      ],
      [
        'client-2',

        buildStubLightweightClient({
          id: 'client-2',
          name: 'Test Client 2',
          mc: 'MC789',
          dot: 'DOT012',
        }),
      ],
    ]);

    invoiceDataMap = new Map<string, RawVolumeReportInvoiceData>([
      [
        'client-1',
        {
          client_id: 'client-1',
          ar_total: '1000000',
          factor_fees_total: '30000',
        },
      ],
    ]);

    transformer = new VolumeReportDataTransformer(clientsMap, invoiceDataMap);
  });

  it('should transform factoring config with invoice data', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: 'Success Team A',
      sales_rep_first_name: 'John',
      sales_rep_last_name: 'Doe',
    };

    const result = transformer.doTransform(chunk);

    expect(result).toEqual({
      clientName: 'Test Client 1',
      accountManagerName: 'Success Team A',
      clientMC: 'MC123',
      clientDOT: 'DOT456',
      salesperson: 'John Doe',
      totalInvoices: new Big('1000000'),
      totalFees: new Big('30000'),
    });
  });

  it('should transform factoring config without invoice data (zero values)', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-2',
      client_success_team_name: 'Success Team B',
      sales_rep_first_name: 'Jane',
      sales_rep_last_name: 'Smith',
    };

    const result = transformer.doTransform(chunk);

    expect(result).toEqual({
      clientName: 'Test Client 2',
      accountManagerName: 'Success Team B',
      clientMC: 'MC789',
      clientDOT: 'DOT012',
      salesperson: 'Jane Smith',
      totalInvoices: new Big(0),
      totalFees: new Big(0),
    });
  });

  it('should handle missing client data with N/A', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-unknown',
      client_success_team_name: 'Success Team C',
      sales_rep_first_name: 'Bob',
      sales_rep_last_name: 'Johnson',
    };

    const result = transformer.doTransform(chunk);

    expect(result).toEqual({
      clientName: 'N/A',
      accountManagerName: 'Success Team C',
      clientMC: 'N/A',
      clientDOT: 'N/A',
      salesperson: 'Bob Johnson',
      totalInvoices: new Big(0),
      totalFees: new Big(0),
    });
  });

  it('should handle null success team name with N/A', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: null,
      sales_rep_first_name: 'John',
      sales_rep_last_name: 'Doe',
    };

    const result = transformer.doTransform(chunk);

    expect(result.accountManagerName).toBe('N/A');
  });

  it('should handle null sales rep with N/A', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: 'Success Team A',
      sales_rep_first_name: null,
      sales_rep_last_name: null,
    };

    const result = transformer.doTransform(chunk);

    expect(result.salesperson).toBe('N/A');
  });

  it('should handle sales rep with only first name', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: 'Success Team A',
      sales_rep_first_name: 'John',
      sales_rep_last_name: null,
    };

    const result = transformer.doTransform(chunk);

    expect(result.salesperson).toBe('John');
  });

  it('should handle sales rep with only last name', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: 'Success Team A',
      sales_rep_first_name: null,
      sales_rep_last_name: 'Doe',
    };

    const result = transformer.doTransform(chunk);

    expect(result.salesperson).toBe('Doe');
  });

  it('should handle empty string sales rep names', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: 'Success Team A',
      sales_rep_first_name: '',
      sales_rep_last_name: '',
    };

    const result = transformer.doTransform(chunk);

    expect(result.salesperson).toBe('N/A');
  });

  it('should correctly convert string invoice totals to Big', () => {
    const chunk: RawClientFactoringConfigWithTeam = {
      client_id: 'client-1',
      client_success_team_name: 'Success Team A',
      sales_rep_first_name: 'John',
      sales_rep_last_name: 'Doe',
    };

    const result = transformer.doTransform(chunk);

    expect(result.totalInvoices).toBeInstanceOf(Big);
    expect(result.totalFees).toBeInstanceOf(Big);
    expect(result.totalInvoices.toString()).toBe('1000000');
    expect(result.totalFees.toString()).toBe('30000');
  });
});
