import { UserMapper } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { TagDefinitionMapper } from './tag-definition.mapper';

describe('TagDefinitionMapper', () => {
  let mapper: TagDefinitionMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagDefinitionMapper, UserMapper],
    }).compile();

    mapper = module.get<TagDefinitionMapper>(TagDefinitionMapper);
  }, 60000);

  it('Should be defined', () => {
    expect(mapper).toBeDefined();
  });

  it('Entity is converted to model', async () => {
    const entity = EntityStubs.buildStubTagDefinition();
    const model = await mapper.entityToModel(entity);

    expect(model.id).toBe(entity.id);
    expect(model.key).toBe(entity.key);
    expect(model.level).toBe(entity.level);
    expect(model.createdAt).toStrictEqual(entity.createdAt);
    expect(model.createdBy?.id).toBe(entity.createdBy?.id);
    expect(model.updatedAt).toStrictEqual(entity.updatedAt);
    expect(model.updatedBy?.id).toBe(entity.updatedBy?.id);
  });
});
