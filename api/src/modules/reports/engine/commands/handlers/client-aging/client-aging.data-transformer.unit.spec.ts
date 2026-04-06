import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import Big from 'big.js';
import { RawClientNetFundsEmployedData } from '../../../data-access-types';
import {
  ClientAgingDataTransformer,
  ClientData,
} from './client-aging.data-transformer';
import { ClientAgingReportData } from './data';

const makeClient = (
  overrides: Partial<ClientData> & { id: string },
): ClientData =>
  ({
    id: overrides.id,
    name: overrides.name ?? 'Test Client',
    mc: overrides.mc ?? 'MC123',
    dot: overrides.dot ?? 'DOT123',
    clientSuccessTeam: overrides.clientSuccessTeam ?? 'Team A',
  } as ClientData);

const makeRawData = (
  overrides: Partial<RawClientNetFundsEmployedData> = {},
): RawClientNetFundsEmployedData => ({
  client_id: 'client-1',
  days_0_to_30: 100,
  days_31_to_60: 200,
  days_61_to_90: 300,
  days_91_plus: 400,
  ar_total: 1000,
  factor_fees_total: 50,
  reserve_fees_total: 10,
  deduction_total: 5,
  ...overrides,
});

const collectResults = async (
  source: Readable,
  transformer: ClientAgingDataTransformer,
): Promise<ClientAgingReportData[]> => {
  const results: ClientAgingReportData[] = [];
  const dest = new Writable({
    objectMode: true,
    write(chunk, _, callback) {
      results.push(chunk);
      callback();
    },
  });
  await pipeline(source, transformer, dest);
  return results;
};

describe('ClientAgingDataTransformer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should transform raw data into client aging format', async () => {
    const client = makeClient({
      id: 'client-1',
      name: 'Acme Corp',
      mc: 'MC999',
      dot: 'DOT999',
      clientSuccessTeam: 'Success Team',
    });
    const transformer = new ClientAgingDataTransformer([client]);
    const raw = makeRawData();

    const results = await collectResults(Readable.from([raw]), transformer);

    expect(results.length).toBe(2);
    expect(results[0]).toEqual({
      clientName: 'Acme Corp',
      accountManagerName: 'Success Team',
      clientMC: 'MC999',
      clientDOT: 'DOT999',
      zeroToThirtyAging: new Big(100),
      thirtyOneToSixtyAging: new Big(200),
      sixtyOneToNinetyAging: new Big(300),
      ninetyPlusAging: new Big(400),
      totalInvoices: new Big(1000),
      fees: new Big(50),
    });
  });

  it('should use N/A when client is not found', async () => {
    const transformer = new ClientAgingDataTransformer([]);
    const raw = makeRawData({ client_id: 'unknown' });

    const results = await collectResults(Readable.from([raw]), transformer);

    expect(results[0].clientName).toBe('N/A');
    expect(results[0].accountManagerName).toBe('N/A');
    expect(results[0].clientMC).toBe('N/A');
    expect(results[0].clientDOT).toBe('N/A');
  });

  it('should produce a total row summing all numeric columns', async () => {
    const clients = [
      makeClient({ id: 'client-1' }),
      makeClient({ id: 'client-2' }),
    ];
    const transformer = new ClientAgingDataTransformer(clients);

    const raw1 = makeRawData({
      client_id: 'client-1',
      days_0_to_30: 100,
      days_31_to_60: 200,
      days_61_to_90: 300,
      days_91_plus: 400,
      ar_total: 1000,
      factor_fees_total: 50,
    });
    const raw2 = makeRawData({
      client_id: 'client-2',
      days_0_to_30: 150,
      days_31_to_60: 250,
      days_61_to_90: 350,
      days_91_plus: 450,
      ar_total: 2000,
      factor_fees_total: 75,
    });

    const results = await collectResults(
      Readable.from([raw1, raw2]),
      transformer,
    );

    expect(results.length).toBe(3);

    const totalRow = results[2];
    expect(totalRow).toEqual({
      clientName: 'Total',
      accountManagerName: '',
      clientMC: '',
      clientDOT: '',
      zeroToThirtyAging: new Big(250),
      thirtyOneToSixtyAging: new Big(450),
      sixtyOneToNinetyAging: new Big(650),
      ninetyPlusAging: new Big(850),
      totalInvoices: new Big(3000),
      fees: new Big(125),
    });
  });

  it('should not push a total row when there are no records', async () => {
    const transformer = new ClientAgingDataTransformer([]);

    const results = await collectResults(Readable.from([]), transformer);

    expect(results.length).toBe(0);
  });
});
