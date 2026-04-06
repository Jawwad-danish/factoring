import { EntityNotFoundError } from '@core/errors';
import { DatabaseService } from '@module-database';
import {
  RecordStatus,
  TagDefinitionEntity,
  TagDefinitionGroupKey,
  TagDefinitionKey,
  UsedByType,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class TagDefinitionRepository extends BasicRepository<TagDefinitionEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, TagDefinitionEntity);
  }

  findByGroup(group: TagDefinitionGroupKey): Promise<TagDefinitionEntity[]> {
    return this.repository.find({
      group: {
        group: {
          key: group,
        },
      },
    });
  }

  findByType(type: UsedByType): Promise<TagDefinitionEntity[]> {
    return this.repository.find({
      usedBy: type,
    });
  }

  findByKey(key: TagDefinitionKey): Promise<TagDefinitionEntity | null> {
    return this.repository.findOne({
      key,
      recordStatus: RecordStatus.Active,
    });
  }

  async getByKey(key: TagDefinitionKey): Promise<TagDefinitionEntity> {
    const found = await this.findByKey(key);
    if (!found) {
      throw new EntityNotFoundError(`Could not find tag with key ${key}`);
    }
    return found;
  }

  async findByKeys(keys: TagDefinitionKey[]): Promise<TagDefinitionEntity[]> {
    return this.repository.find({
      key: {
        $in: keys,
      },
    });
  }

  async saveAll(
    entities: TagDefinitionEntity[],
  ): Promise<TagDefinitionEntity[]> {
    return this.entityManager
      .createQueryBuilder(TagDefinitionEntity)
      .insert(entities)
      .onConflict('key')
      .ignore()
      .getResultList();
  }

  async persistAndFlush(
    entity: TagDefinitionEntity,
  ): Promise<TagDefinitionEntity> {
    await this.entityManager
      .createQueryBuilder(TagDefinitionEntity)
      .insert(entity)
      .onConflict('key')
      .ignore()
      .getSingleResult();
    return entity;
  }
}
