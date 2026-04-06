import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { RawApprovedAgingData } from '../../../reports.data-access';
import { ApprovedAgingDataTransformer } from './approved-aging.data-transformer';
import { BrokerLite, ClientLite } from './data';

describe('StandardizeDataTransform', () => {
  let transformer: ApprovedAgingDataTransformer;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should transform raw data into standardized format', async () => {
    const rawData: RawApprovedAgingData = {
      created_at: new Date('2025-01-01'),
      load_number: 'LOAD-123',
      display_id: 'INV-123',
      client_id: 'client-1',
      broker_id: 'broker-1',
      accounts_receivable_value: 1000,
      line_haul_rate: 2000,
    };

    const clientsMap = new Map<string, ClientLite>();
    clientsMap.set('client-1', {
      id: 'client-1',
      name: 'Test Client',
      mc: 'MC123456',
    });

    const brokersMap = new Map<string, BrokerLite>();
    brokersMap.set('broker-1', {
      id: 'broker-1',
      legalName: 'Test Broker',
      mc: 'MC654321',
    });

    transformer = new ApprovedAgingDataTransformer({
      clients: clientsMap,
      brokers: brokersMap,
    });

    const source = Readable.from([rawData]);
    const results: any[] = [];
    const dest = new Writable({
      objectMode: true,
      write(chunk, _, callback) {
        results.push(chunk);
        callback();
      },
    });

    await pipeline(source, transformer, dest);

    expect(results.length).toBe(2);
    expect(results[0]).toEqual({
      createdAt: rawData.created_at,
      loadNumber: 'LOAD-123',
      displayId: 'INV-123',
      clientName: 'Test Client/MC: MC123456',
      brokerName: 'Test Broker/MC: MC654321',
      arValue: 1000,
      lineHaulRate: 2000,
    });
  });

  it('should handle missing client and broker data', async () => {
    const rawData: RawApprovedAgingData = {
      created_at: new Date('2025-01-01'),
      load_number: 'LOAD-123',
      display_id: 'INV-123',
      client_id: 'client-1',
      broker_id: 'broker-1',
      accounts_receivable_value: 1000,
      line_haul_rate: 2000,
    };

    // Empty maps - simulating missing client and broker data
    transformer = new ApprovedAgingDataTransformer({
      clients: new Map<string, ClientLite>(),
      brokers: new Map<string, BrokerLite>(),
    });

    const source = Readable.from([rawData]);
    const results: any[] = [];
    const dest = new Writable({
      objectMode: true,
      write(chunk, _, callback) {
        results.push(chunk);
        callback();
      },
    });

    await pipeline(source, transformer, dest);

    expect(results.length).toBe(2);
    expect(results[0]).toEqual({
      createdAt: rawData.created_at,
      loadNumber: 'LOAD-123',
      displayId: 'INV-123',
      clientName: 'N/A',
      brokerName: 'N/A',
      arValue: 1000,
      lineHaulRate: 2000,
    });
  });

  it('should process multiple records', async () => {
    const rawData1: RawApprovedAgingData = {
      created_at: new Date('2025-01-01'),
      load_number: 'LOAD-123',
      display_id: 'INV-123',
      client_id: 'client-1',
      broker_id: 'broker-1',
      accounts_receivable_value: 1000,
      line_haul_rate: 2000,
    };

    const rawData2: RawApprovedAgingData = {
      created_at: new Date('2025-01-02'),
      load_number: 'LOAD-456',
      display_id: 'INV-456',
      client_id: 'client-2',
      broker_id: 'broker-2',
      accounts_receivable_value: 3000,
      line_haul_rate: 2000,
    };

    const clientsMap = new Map<string, ClientLite>();
    clientsMap.set('client-1', {
      id: 'client-1',
      name: 'Client client-1',
      mc: 'MC-client-1',
    });
    clientsMap.set('client-2', {
      id: 'client-2',
      name: 'Client client-2',
      mc: 'MC-client-2',
    });

    const brokersMap = new Map<string, BrokerLite>();
    brokersMap.set('broker-1', {
      id: 'broker-1',
      legalName: 'Broker broker-1',
      mc: 'MC-broker-1',
    });
    brokersMap.set('broker-2', {
      id: 'broker-2',
      legalName: 'Broker broker-2',
      mc: 'MC-broker-2',
    });

    transformer = new ApprovedAgingDataTransformer({
      clients: clientsMap,
      brokers: brokersMap,
    });

    const source = Readable.from([rawData1, rawData2]);
    const results: any[] = [];
    const dest = new Writable({
      objectMode: true,
      write(chunk, _, callback) {
        results.push(chunk);
        callback();
      },
    });

    await pipeline(source, transformer, dest);

    expect(results.length).toBe(3);

    const totalRow = results[2];
    expect(totalRow).toEqual({
      createdAt: '',
      loadNumber: 'Total',
      displayId: '',
      brokerName: '',
      clientName: '',
      arValue: 4000,
      lineHaulRate: 4000,
    });
  });

  it('should not add a total row when there are no rows', async () => {
    const pushSpy = jest.spyOn(transformer, 'push');

    const source = Readable.from([]);
    const results: any[] = [];
    const dest = new Writable({
      objectMode: true,
      write(chunk, _, callback) {
        results.push(chunk);
        callback();
      },
    });

    await pipeline(source, transformer, dest);

    expect(pushSpy).toHaveBeenCalledTimes(0);
    expect(results.length).toBe(0);
  });
});
