import { EntityNotFoundError } from '@core/errors';
import { DatabaseService } from '@module-database';
import {
  TagDefinitionGroupEntity,
  TagDefinitionGroupKey,
} from '@module-persistence/entities';
import { Inject, Injectable } from '@nestjs/common';
import { BasicRepository } from './basic-repository';

@Injectable()
export class TagDefinitionGroupRepository extends BasicRepository<TagDefinitionGroupEntity> {
  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, TagDefinitionGroupEntity);
  }

  async getByKey(
    key: TagDefinitionGroupKey,
  ): Promise<TagDefinitionGroupEntity> {
    const found = await this.repository.findOne({
      key,
    });

    if (!found) {
      throw new EntityNotFoundError(`Could not find tag group with key ${key}`);
    }
    return found;
  }

  async findByKeys(
    keys: TagDefinitionGroupKey[],
  ): Promise<TagDefinitionGroupEntity[]> {
    return this.repository.find({
      key: {
        $in: keys,
      },
    });
  }
}
