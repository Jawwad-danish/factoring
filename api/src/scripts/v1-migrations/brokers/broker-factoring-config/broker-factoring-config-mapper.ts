import { EntityManager } from '@mikro-orm/core';
import {
  BrokerFactoringConfigEntity,
  BrokerLimitAssocEntity,
  RecordStatus,
  UserEntity,
} from '@module-persistence';
import Big from 'big.js';
import { getSystemID } from 'src/scripts/util';

export function buildBrokerFactoringConfig(
  brokerData: any,
  em: EntityManager,
): BrokerFactoringConfigEntity {
  const entity = new BrokerFactoringConfigEntity();
  entity.brokerId = brokerData.id;
  entity.limitAmount = brokerData.debtor_limit
    ? new Big(brokerData.debtor_limit)
    : null;
  entity.createdAt = new Date(brokerData.created_at);
  entity.updatedAt = new Date(brokerData.updated_at);
  entity.recordStatus = RecordStatus.Active;
  entity.createdBy = brokerData.created_by
    ? em.getReference(UserEntity, brokerData.created_by)
    : em.getReference(UserEntity, getSystemID());
  entity.updatedBy = brokerData.updated_by
    ? em.getReference(UserEntity, brokerData.updated_by)
    : em.getReference(UserEntity, getSystemID());

  return entity;
}

export const addBrokerLimitHistory = (
  brokerFactoringConfig: BrokerFactoringConfigEntity,
  item: any,
  em: EntityManager,
) => {
  if (!item?.debtor_limit_history?.length) {
    return brokerFactoringConfig;
  }

  const items = item.debtor_limit_history.map((historyItem: any) => {
    const assocEntity = new BrokerLimitAssocEntity();
    assocEntity.note = historyItem.note || '';
    assocEntity.limitAmount = historyItem.debtor_limit
      ? new Big(historyItem.debtor_limit)
      : null;
    assocEntity.createdAt = new Date(historyItem.created_at);
    assocEntity.createdBy = historyItem.created_by
      ? em.getReference(UserEntity, historyItem.created_by)
      : em.getReference(UserEntity, getSystemID());
    assocEntity.config = brokerFactoringConfig;
    return assocEntity;
  });

  brokerFactoringConfig.limitHistory.set(items);
  return brokerFactoringConfig;
};
