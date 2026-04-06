import { Collection } from '@mikro-orm/core';
import { BasicEntity, RecordStatus } from '../entities';

export class BasicEntityUtil {
  static getLastActiveEntity<TEntity extends BasicEntity>(
    items: Collection<TEntity> | TEntity[],
  ): null | TEntity {
    const entities =
      items instanceof Collection && items.isInitialized()
        ? items.getItems()
        : items;

    const activeEntities = entities.filter(
      (item) => item.recordStatus === RecordStatus.Active,
    );
    if (activeEntities.length === 0) {
      return null;
    }

    return activeEntities.sort(
      (item1, item2) => item2.createdAt.getTime() - item1.createdAt.getTime(),
    )[0];
  }

  static sortEntitiesDesc<TEntity extends BasicEntity>(
    items: Collection<TEntity> | TEntity[],
  ): TEntity[] {
    const entities =
      items instanceof Collection && items.isInitialized()
        ? items.getItems()
        : items;

    return Array.from(entities).sort(
      (item1, item2) => item2.createdAt.getTime() - item1.createdAt.getTime(),
    );
  }

  static sortEntitiesAsc<TEntity extends BasicEntity>(
    items: Collection<TEntity> | TEntity[],
  ): TEntity[] {
    const entities =
      items instanceof Collection && items.isInitialized()
        ? items.getItems()
        : items;

    return Array.from(entities).sort(
      (item1, item2) => item1.createdAt.getTime() - item2.createdAt.getTime(),
    );
  }

  static getFirstActiveEntity<TEntity extends BasicEntity>(
    items: Collection<TEntity> | TEntity[],
  ): null | TEntity {
    const entities =
      items instanceof Collection && items.isInitialized()
        ? items.getItems()
        : items;

    const activeEntities = entities.filter(
      (item) => item.recordStatus === RecordStatus.Active,
    );
    if (activeEntities.length === 0) {
      return null;
    }

    return activeEntities.sort(
      (item1, item2) => item1.createdAt.getTime() - item2.createdAt.getTime(),
    )[0];
  }
}
