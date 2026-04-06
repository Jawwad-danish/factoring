import { TagDefinition } from '@fs-bobtail/factoring/data';
import { TagDefinitionKey, UsedByType } from '@module-persistence/entities';
import { TagDefinitionRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import { Arrays } from '../../../core';
import { TagDefinitionMapper } from '../data';

@Injectable()
export class TagDefinitionService {
  constructor(
    private tagDefinitionRepository: TagDefinitionRepository,
    private tagDefinitionMapper: TagDefinitionMapper,
  ) {}

  async findByType(type: UsedByType): Promise<TagDefinition[]> {
    const found = await this.tagDefinitionRepository.findByType(type);
    return await Arrays.mapAsync(found, (e) =>
      this.tagDefinitionMapper.entityToModel(e),
    );
  }

  async findByKey(key: TagDefinitionKey): Promise<TagDefinition | null> {
    const found = await this.tagDefinitionRepository.findByKey(key);
    return found ? this.tagDefinitionMapper.entityToModel(found) : null;
  }

  async findOneById(id: string): Promise<TagDefinition | null> {
    const found = await this.tagDefinitionRepository.findOneById(id);
    return found ? await this.tagDefinitionMapper.entityToModel(found) : null;
  }
}
