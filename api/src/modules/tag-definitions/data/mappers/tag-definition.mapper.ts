import { DataMapper } from '@core/mapping';
import { TagDefinition } from '@fs-bobtail/factoring/data';
import { UserMapper } from '@module-common';
import { TagDefinitionEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TagDefinitionMapper
  implements DataMapper<TagDefinitionEntity, TagDefinition>
{
  constructor(private readonly userMapper: UserMapper) {}

  async entityToModel(entity: TagDefinitionEntity): Promise<TagDefinition> {
    const tag = new TagDefinition({
      id: entity.id,
      name: entity.name,
      key: entity.key,
      level: entity.level,
      visibility: entity.visibility,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedBy: await this.userMapper.updatedByToModel(entity),
      recordStatus: entity.recordStatus,
    });
    return tag;
  }
}
