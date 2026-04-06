import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  BrokerFactoringConfigEntity,
  BrokerLimitAssocEntity,
} from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateBrokerFactoringConfigCommand } from '../../update-broker-factoring-config.command';
import { UpdateBrokerFactoringConfigCommandHandler } from './update-broker-factoring-config.command-handler';
import {
  PartialBrokerFactoringConfigsEntity,
  EntityStubs,
} from '@module-persistence/test';
import Big from 'big.js';
import { BrokerFactoringConfigDataAccess } from '@module-brokers';

describe('UpdateBrokerFactoringConfigCommandHandler', () => {
  let dataAccess: BrokerFactoringConfigDataAccess;
  let handler: UpdateBrokerFactoringConfigCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        UpdateBrokerFactoringConfigCommandHandler,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    dataAccess = module.get(BrokerFactoringConfigDataAccess);
    handler = module.get(UpdateBrokerFactoringConfigCommandHandler);
  });

  const mockBrokerFactoringConfig = (
    data?: PartialBrokerFactoringConfigsEntity,
  ): BrokerFactoringConfigEntity => {
    const config = EntityStubs.buildBrokerFactoringConfigStub(data);
    jest
      .spyOn(dataAccess, 'getOrCreateFactoringConfigForBroker')
      .mockResolvedValueOnce(config);
    return config;
  };

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('limit updates', () => {
    it('should update the broker factoring config with a new limit amount and history', async () => {
      mockBrokerFactoringConfig({
        limitAmount: Big(1000),
      });

      const command = new UpdateBrokerFactoringConfigCommand('broker-id', {
        limitAmount: Big(2000),
        limitNote: 'Increased limit',
      });

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.limitAmount).toEqual(Big(2000));
      expect(result.limitHistory).toHaveLength(1);

      const historyEntry = result.limitHistory[0];
      expect(historyEntry.limitAmount).toEqual(Big(2000));
      expect(historyEntry.note).toBe('Increased limit');
    });

    it('should not update the limit amount or history if limitAmount is not provided', async () => {
      mockBrokerFactoringConfig({
        limitAmount: Big(1000),
      });

      const command = new UpdateBrokerFactoringConfigCommand('broker-id', {
        limitNote: 'No limit change',
      });

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.limitAmount).toEqual(Big(1000));
      expect(result.limitHistory).toHaveLength(0);
    });

    it('should handle updating a config with existing limit history', async () => {
      const existingHistory = new BrokerLimitAssocEntity();
      existingHistory.limitAmount = Big(1000);
      existingHistory.note = 'Initial limit';

      mockBrokerFactoringConfig({
        limitAmount: Big(1000),
        limitHistory: [existingHistory],
      });

      const command = new UpdateBrokerFactoringConfigCommand('broker-id', {
        limitAmount: Big(2000),
        limitNote: 'Increased limit',
      });

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.limitAmount).toEqual(Big(2000));
      expect(result.limitHistory).toHaveLength(2);

      const newHistoryEntry = result.limitHistory[1];
      expect(newHistoryEntry.limitAmount).toEqual(Big(2000));
      expect(newHistoryEntry.note).toBe('Increased limit');
    });
  });
});
