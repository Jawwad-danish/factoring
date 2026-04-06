import { Collection } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import {
  ClassConstructor,
  ClassTransformOptions,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';
import { deepNullRemove } from './deep-null-remove';
import { instanceToPlainToInstance } from './instance-to-instance';

export interface ModelToEntityOptions extends ClassTransformOptions {
  removeNull: boolean;
}

export abstract class BaseMapper<Entity, Model, CreateRequestDTO> {
  protected logger: Logger = new Logger(BaseMapper.name);
  constructor(
    private entityClass: ClassConstructor<Entity>,
    private modelClass: ClassConstructor<Model>,
    //@ts-ignore
    private requestDTOClass: ClassConstructor<CreateRequestDTO>,
  ) {}

  requestToModel(dto: CreateRequestDTO): Model {
    const modelInstance = instanceToPlainToInstance(this.modelClass, dto);
    Object.keys(modelInstance as any).forEach(
      (key) => modelInstance[key] === undefined && delete modelInstance[key],
    );
    return modelInstance;
  }

  requestsToModels(dtos: CreateRequestDTO[]): Model[] {
    return dtos.map((dto) => this.requestToModel(dto));
  }

  modelToEntity(
    model: Model,
    options: ModelToEntityOptions = {
      ignoreDecorators: true,
      removeNull: false,
    },
  ): Entity {
    let plain = instanceToPlain(model, options);
    if (options.removeNull) {
      plain = deepNullRemove(plain) as Record<string, unknown>;
    }
    return plainToInstance(this.entityClass, plain);
  }

  modelsToEntities(models: Model[]): Entity[] {
    return models.map((model) => this.modelToEntity(model));
  }

  entityToModel(
    entity: Entity,
    options: ClassTransformOptions = {
      ignoreDecorators: true,
    },
  ): Model {
    this.logger.debug(
      `Mapping entity ${this.entityClass.name} to model ${this.modelClass.name}`,
    );

    const plain = instanceToPlain(entity, options);
    const modelInstance = plainToInstance(this.modelClass, plain, options);
    return modelInstance;
  }

  entitiesToModels(
    entities: Entity[],
    options: ModelToEntityOptions = {
      ignoreDecorators: true,
      removeNull: false,
    },
  ): Model[] {
    return entities.map((entity) => this.entityToModel(entity, options));
  }

  protected mapCollections<E extends object, M extends object>(
    collection: Collection<E> | E[],
    mapper: (entity: E) => M,
  ): M[] {
    if (collection instanceof Collection && collection.isInitialized()) {
      return collection.map((item) => mapper(item));
    }
    if (Array.isArray(collection)) {
      return collection.map((item) => mapper(item));
    }
    return [];
  }
}
