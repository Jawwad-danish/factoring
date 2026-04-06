import { DataMapper } from '@core/mapping';
import { Arrays } from '@core/util';
import { ValidationError } from '@core/validation';
import { Collection } from '@mikro-orm/core';
import { BasicEntity, RecordStatus } from '@module-persistence/entities';

const isInstanceofDataMapper = <TEntity, TModel>(
  mapper: any,
): mapper is DataMapper<TEntity, TModel> => {
  return 'entityToModel' in mapper;
};

const isMappingFunction = <TEntity, TModel>(
  mapper: any,
): mapper is (entity: TEntity) => Promise<TModel> => {
  return typeof mapper === 'function';
};

export interface MappingOptions {
  onlyActive: boolean;
}

export class DataMapperUtil {
  static mapCollections<TEntity extends BasicEntity, TModel extends object>(
    collection: Collection<TEntity> | TEntity[],
    mapper: (entity: TEntity) => TModel,
    options?: MappingOptions,
  ): TModel[] {
    let items: TEntity[] = [];
    if (collection instanceof Collection && collection.isInitialized()) {
      items = collection.getItems();
    }
    if (Array.isArray(collection)) {
      items = collection;
    }
    if (options?.onlyActive) {
      items = items.filter((item) => item.recordStatus === RecordStatus.Active);
    }
    return items.map(mapper);
  }

  static async asyncMapCollections<
    TEntity extends BasicEntity,
    TModel extends object,
  >(
    collection: Collection<TEntity> | TEntity[],
    mapper:
      | ((entity: TEntity) => Promise<TModel>)
      | DataMapper<TEntity, TModel>,
    options?: MappingOptions,
  ): Promise<TModel[]> {
    let items: TEntity[] = [];
    if (collection instanceof Collection && collection.isInitialized()) {
      items = collection.getItems();
    }
    if (Array.isArray(collection)) {
      items = collection;
    }
    if (options?.onlyActive) {
      items = items.filter((item) => item.recordStatus === RecordStatus.Active);
    }
    if (isInstanceofDataMapper<TEntity, TModel>(mapper)) {
      return await Arrays.mapAsync(items, (item) => mapper.entityToModel(item));
    }
    if (isMappingFunction<TEntity, TModel>(mapper)) {
      return await Arrays.mapAsync(items, mapper);
    }

    throw new ValidationError('item-mapper', 'Invalid mapper');
  }
}
