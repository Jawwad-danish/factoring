import { Customer } from '@balancer-team/quickbooks/dist/schemas';
import { createMock } from '@golevelup/ts-jest';
import { ClientApi, LightweightClient } from '@module-clients';
import {
  ClientFactoringConfigsRepository,
  EntityStubs,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { QuickbooksApi } from '../../../../api';
import { SyncQuickbooksClientsCommandHandler } from './sync-quickbooks-clients.command-handler';

describe('SyncQuickbooksClientsCommandHandler', () => {
  let handler: SyncQuickbooksClientsCommandHandler;
  const quickbooksApiMock = createMock<QuickbooksApi>();
  const clientApi = createMock<ClientApi>();
  const factoringConfigRepository =
    createMock<ClientFactoringConfigsRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncQuickbooksClientsCommandHandler,
        {
          provide: QuickbooksApi,
          useValue: quickbooksApiMock,
        },
        {
          provide: ClientApi,
          useValue: clientApi,
        },
        {
          provide: ClientFactoringConfigsRepository,
          useValue: factoringConfigRepository,
        },
      ],
    }).compile();

    handler = module.get(SyncQuickbooksClientsCommandHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should do nothing if no factoring configs exist', async () => {
    const clients: LightweightClient[] = [
      { id: 'client-1', name: 'Client A', mc: 'MC123' } as LightweightClient,
    ];

    clientApi.getAllClients.mockResolvedValue(clients);
    factoringConfigRepository.findByClientIds.mockResolvedValue([]);

    await handler.execute();

    expect(quickbooksApiMock.createCustomer).not.toHaveBeenCalled();
    expect(quickbooksApiMock.updateCustomer).not.toHaveBeenCalled();
  });

  it('should skip sync if client not found for factoring config', async () => {
    const clients: LightweightClient[] = [];
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: null,
    });

    clientApi.getAllClients.mockResolvedValue(clients);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);

    await handler.execute();

    expect(quickbooksApiMock.createCustomer).not.toHaveBeenCalled();
    expect(quickbooksApiMock.updateCustomer).not.toHaveBeenCalled();
  });

  it('should link existing customer if found by name', async () => {
    const client: LightweightClient = {
      id: 'client-1',
      name: 'Client A',
      mc: 'MC123',
    } as LightweightClient;
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: null,
    });
    const existingCustomer = {
      Id: 'qb-123',
      DisplayName: 'Client A',
    } as Customer;

    clientApi.getAllClients.mockResolvedValue([client]);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);
    quickbooksApiMock.getCustomerByName.mockResolvedValue(existingCustomer);

    await handler.execute();

    expect(quickbooksApiMock.getCustomerByName).toHaveBeenCalledWith(
      'Client A',
    );
    expect(factoringConfig.quickbooksId).toBe('qb-123');
    expect(factoringConfig.quickbooksName).toBe('Client A');
    expect(quickbooksApiMock.createCustomer).not.toHaveBeenCalled();
  });

  it('should create new customer if not found by name', async () => {
    const client: LightweightClient = {
      id: 'client-1',
      name: 'Client A',
      mc: 'MC123',
    } as LightweightClient;
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: null,
    });
    const newCustomer = {
      Id: 'qb-456',
      DisplayName: 'Client A',
    } as Customer;

    clientApi.getAllClients.mockResolvedValue([client]);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);
    quickbooksApiMock.getCustomerByName.mockResolvedValue(null);
    quickbooksApiMock.createCustomer.mockResolvedValue(newCustomer);

    await handler.execute();

    expect(quickbooksApiMock.createCustomer).toHaveBeenCalledWith({
      DisplayName: 'Client A',
    });
    expect(factoringConfig.quickbooksId).toBe('qb-456');
    expect(factoringConfig.quickbooksName).toBe('Client A');
  });

  it('should skip update if name is already in sync', async () => {
    const client: LightweightClient = {
      id: 'client-1',
      name: 'Client A',
      mc: 'MC123',
    } as LightweightClient;
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: 'qb-123',
      quickbooksName: 'Client A',
    });

    clientApi.getAllClients.mockResolvedValue([client]);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);

    await handler.execute();

    expect(quickbooksApiMock.getCustomerById).not.toHaveBeenCalled();
    expect(quickbooksApiMock.updateCustomer).not.toHaveBeenCalled();
  });

  it('should update customer name if out of sync', async () => {
    const client: LightweightClient = {
      id: 'client-1',
      name: 'Client A Updated',
      mc: 'MC123',
    } as LightweightClient;
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: 'qb-123',
      quickbooksName: 'Client A',
    });
    const existingCustomer = {
      Id: 'qb-123',
      SyncToken: '5',
      DisplayName: 'Client A',
    } as Customer;
    const updatedCustomer = {
      Id: 'qb-123',
      DisplayName: 'Client A Updated',
    } as Customer;

    clientApi.getAllClients.mockResolvedValue([client]);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);
    quickbooksApiMock.getCustomerById.mockResolvedValue(existingCustomer);
    quickbooksApiMock.getCustomerByName.mockResolvedValue(null);
    quickbooksApiMock.updateCustomer.mockResolvedValue(updatedCustomer);

    await handler.execute();

    expect(quickbooksApiMock.getCustomerById).toHaveBeenCalledWith('qb-123');
    expect(quickbooksApiMock.updateCustomer).toHaveBeenCalledWith({
      Id: 'qb-123',
      SyncToken: '5',
      DisplayName: 'Client A Updated',
    });
    expect(factoringConfig.quickbooksName).toBe('Client A Updated');
  });

  it('should skip update if quickbooks customer not found', async () => {
    const client: LightweightClient = {
      id: 'client-1',
      name: 'Client A Updated',
      mc: 'MC123',
    } as LightweightClient;
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: 'qb-123',
      quickbooksName: 'Client A',
    });

    clientApi.getAllClients.mockResolvedValue([client]);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);
    quickbooksApiMock.getCustomerById.mockResolvedValue(null);

    await handler.execute();

    expect(quickbooksApiMock.updateCustomer).not.toHaveBeenCalled();
  });

  it('should use name with MC suffix if base name is taken', async () => {
    const client: LightweightClient = {
      id: 'client-1',
      name: 'Client A Updated',
      mc: 'MC123456',
    } as LightweightClient;
    const factoringConfig = EntityStubs.buildClientFactoringConfig({
      clientId: 'client-1',
      quickbooksId: 'qb-123',
      quickbooksName: 'Client A',
    });
    const existingCustomer = {
      Id: 'qb-123',
      SyncToken: '5',
      DisplayName: 'Client A',
    } as Customer;
    const updatedCustomer = {
      Id: 'qb-123',
      DisplayName: 'Client A Updated-456',
    } as Customer;

    clientApi.getAllClients.mockResolvedValue([client]);
    factoringConfigRepository.findByClientIds.mockResolvedValue([
      factoringConfig,
    ]);
    quickbooksApiMock.getCustomerById.mockResolvedValue(existingCustomer);
    quickbooksApiMock.getCustomerByName
      .mockResolvedValueOnce({ Id: 'other' } as Customer)
      .mockResolvedValueOnce(null);
    quickbooksApiMock.updateCustomer.mockResolvedValue(updatedCustomer);

    await handler.execute();

    expect(quickbooksApiMock.getCustomerByName).toHaveBeenCalledWith(
      'Client A Updated',
    );
    expect(quickbooksApiMock.getCustomerByName).toHaveBeenCalledWith(
      'Client A Updated-456',
    );
    expect(quickbooksApiMock.updateCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        DisplayName: 'Client A Updated-456',
      }),
    );
  });
});
