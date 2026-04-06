import { Test, TestingModule } from '@nestjs/testing';
import { BrokerFactoringConfigEntity } from '@module-persistence/entities';
import { BrokerFactoringConfigRepository } from '@module-persistence/repositories';
import { BrokerFactoringConfigDataAccess } from './broker-factoring-config.data-access';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';

describe('BrokerFactoringConfigDataAccess', () => {
  let repository: BrokerFactoringConfigRepository;
  let dataAccess: BrokerFactoringConfigDataAccess;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, BrokerFactoringConfigDataAccess],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    dataAccess = module.get(BrokerFactoringConfigDataAccess);
    repository = module.get(BrokerFactoringConfigRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(dataAccess).toBeDefined();
  });

  describe('flush', () => {
    it('should call repository.flush', async () => {
      const flushSpy = jest.spyOn(repository, 'flush');
      await dataAccess.flush();
      expect(flushSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOrCreateFactoringConfigForBroker', () => {
    it('should return an existing config for the broker', async () => {
      const brokerId = 'broker-1';
      const options = { includeLimitHistory: true };
      const existingConfig = new BrokerFactoringConfigEntity();
      existingConfig.brokerId = brokerId;

      jest
        .spyOn(repository, 'findByBrokerIds')
        .mockResolvedValueOnce([existingConfig]);

      const result = await dataAccess.getOrCreateFactoringConfigForBroker(
        brokerId,
        options,
      );

      expect(result).toBeDefined();
      expect(result.brokerId).toBe(brokerId);
      expect(repository.findByBrokerIds).toHaveBeenCalledWith(
        [brokerId],
        options,
      );
    });

    it('should create a new config if one does not exist for the broker', async () => {
      const brokerId = 'broker-1';
      const options = { includeLimitHistory: true };

      jest.spyOn(repository, 'findByBrokerIds').mockResolvedValueOnce([]);

      const result = await dataAccess.getOrCreateFactoringConfigForBroker(
        brokerId,
        options,
      );

      expect(result).toBeDefined();
      expect(result.brokerId).toBe(brokerId);
      expect(repository.findByBrokerIds).toHaveBeenCalledWith(
        [brokerId],
        options,
      );
      expect(repository.persist).toHaveBeenCalledWith(
        expect.objectContaining({ brokerId }),
      );
    });
  });

  describe('getOrCreateFactoringConfigForBrokers', () => {
    it('should return existing configs and create missing ones', async () => {
      const existingConfig = EntityStubs.buildBrokerFactoringConfigStub();
      const newConfig = EntityStubs.buildBrokerFactoringConfigStub();
      const options = { includeLimitHistory: true };

      jest
        .spyOn(repository, 'findByBrokerIds')
        .mockResolvedValueOnce([existingConfig]);

      const result = await dataAccess.getOrCreateFactoringConfigForBrokers(
        [existingConfig.brokerId, newConfig.brokerId],
        options,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(repository.findByBrokerIds).toHaveBeenCalledWith(
        [existingConfig.brokerId, newConfig.brokerId],
        options,
      );
      expect(repository.persist).toHaveBeenCalledWith(
        expect.objectContaining({ brokerId: newConfig.brokerId }),
      );
    });

    it('should return all new configs if none exist', async () => {
      const brokerIds = ['broker-1', 'broker-2'];
      const options = { includeLimitHistory: true };

      jest.spyOn(repository, 'findByBrokerIds').mockResolvedValueOnce([]);

      const result = await dataAccess.getOrCreateFactoringConfigForBrokers(
        brokerIds,
        options,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].brokerId).toBe('broker-1');
      expect(result[1].brokerId).toBe('broker-2');
      expect(repository.findByBrokerIds).toHaveBeenCalledWith(
        brokerIds,
        options,
      );
      expect(repository.persist).toHaveBeenCalledTimes(2);
    });
  });
});
