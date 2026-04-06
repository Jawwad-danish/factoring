import { UserMapper } from '@module-common';
import { TagDefinitionMapper } from '@module-tag-definitions';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { ActivityLogMapper } from './activity-log.mapper';

describe('TagDefinitionMapper', () => {
  let mapper: ActivityLogMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityLogMapper, TagDefinitionMapper, UserMapper],
    }).compile();

    mapper = module.get<ActivityLogMapper>(ActivityLogMapper);
  }, 60000);

  it('Should be defined', () => {
    expect(mapper).toBeDefined();
  });

  it('Entity is converted to model', async () => {
    const entity = EntityStubs.buildStubActivityLog();
    const model = await mapper.entityToModel(entity);

    expect(model.id).toBe(entity.id);
    expect(model.note).toStrictEqual(entity.note);
    expect(model.payload).toStrictEqual(entity.payload);
    expect(model.createdAt).toStrictEqual(entity.createdAt);
    expect(model.createdBy?.id).toBe(entity.createdBy?.id);
  });
});
