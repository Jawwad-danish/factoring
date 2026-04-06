import { RecordStatus, TagDefinitionKey } from '../entities';
import { BasicEntityUtil } from './basic-entity-util';
import { EntityStubs } from '../test/entity.stubs';

describe('getLastActiveEntity', () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  it('should return null when input is an empty array', () => {
    expect(BasicEntityUtil.getLastActiveEntity([])).toBeNull();
  });

  it('should return the most recent active entity from an array', () => {
    const brokerLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      createdAt: now,
    });
    const clientLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      createdAt: yesterday,
    });
    const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
      createdAt: twoDaysAgo,
    });
    const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

    const result = BasicEntityUtil.getLastActiveEntity(entities);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(brokerLimitTag.id);
  });

  it('should filter out non-active entities', () => {
    const brokerLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      createdAt: now,
      recordStatus: RecordStatus.Inactive,
    });
    const clientLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      createdAt: yesterday,
    });
    const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
      createdAt: twoDaysAgo,
    });
    const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

    const result = BasicEntityUtil.getLastActiveEntity(entities);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(clientLimitTag.id);
  });

  it('should return null if no active entities exist', () => {
    const brokerLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      createdAt: now,
      recordStatus: RecordStatus.Inactive,
    });
    const clientLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      createdAt: yesterday,
      recordStatus: RecordStatus.Inactive,
    });
    const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
      createdAt: twoDaysAgo,
      recordStatus: RecordStatus.Inactive,
    });
    const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

    const result = BasicEntityUtil.getLastActiveEntity(entities);
    expect(result).toBeNull();
  });

  it('should correctly sort by createdAt in descending order', () => {
    const baseDate = new Date('2025-01-01T12:00:00Z');

    const brokerLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
      createdAt: new Date(baseDate.getTime() + 2000),
    });
    const clientLimitTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
      createdAt: new Date(baseDate.getTime() + 1000),
    });
    const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.LOAD_NOT_DELIVERED,
      createdAt: new Date(baseDate.getTime() + 3000),
    });
    const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

    const result = BasicEntityUtil.getLastActiveEntity(entities);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(loadNotDeliveredTag.id);
  });

  describe('getFirstActiveEntity', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    it('should return null when input is an empty array', () => {
      expect(BasicEntityUtil.getFirstActiveEntity([])).toBeNull();
    });

    it('should return the oldest active entity from an array', () => {
      const brokerLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
        createdAt: now,
      });
      const clientLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
        createdAt: yesterday,
      });
      const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.LOAD_NOT_DELIVERED,
        createdAt: twoDaysAgo,
      });
      const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

      const result = BasicEntityUtil.getFirstActiveEntity(entities);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(loadNotDeliveredTag.id);
    });

    it('should filter out non-active entities', () => {
      const brokerLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
        createdAt: now,
      });
      const clientLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
        createdAt: yesterday,
      });
      const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.LOAD_NOT_DELIVERED,
        createdAt: twoDaysAgo,
        recordStatus: RecordStatus.Inactive,
      });
      const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

      const result = BasicEntityUtil.getFirstActiveEntity(entities);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(clientLimitTag.id);
    });

    it('should return null if no active entities exist', () => {
      const brokerLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
        createdAt: now,
        recordStatus: RecordStatus.Inactive,
      });
      const clientLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
        createdAt: yesterday,
        recordStatus: RecordStatus.Inactive,
      });
      const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.LOAD_NOT_DELIVERED,
        createdAt: twoDaysAgo,
        recordStatus: RecordStatus.Inactive,
      });
      const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

      const result = BasicEntityUtil.getFirstActiveEntity(entities);
      expect(result).toBeNull();
    });

    it('should correctly sort by createdAt in ascending order', () => {
      const baseDate = new Date('2025-01-01T12:00:00Z');

      const brokerLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
        createdAt: new Date(baseDate.getTime() + 2000),
      });
      const clientLimitTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.CLIENT_LIMIT_EXCEEDED,
        createdAt: new Date(baseDate.getTime() + 3000),
      });
      const loadNotDeliveredTag = EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.LOAD_NOT_DELIVERED,
        createdAt: new Date(baseDate.getTime() + 1000),
      });
      const entities = [brokerLimitTag, clientLimitTag, loadNotDeliveredTag];

      const result = BasicEntityUtil.getFirstActiveEntity(entities);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(loadNotDeliveredTag.id);
    });
  });
});
