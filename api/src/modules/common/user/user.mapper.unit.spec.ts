import { mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { UserMapper } from './user.mapper';

describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMapper],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    mapper = module.get(UserMapper);
  }, 60000);

  it('Should be defined', () => {
    expect(mapper).toBeDefined();
  });

  it('Entity is converted to model', async () => {
    const entity = EntityStubs.buildStubUser();
    const model = await mapper.entityToModel(entity);

    expect(model.id).toBe(entity.id);
    expect(model.email).toBe(entity.email);
    expect(model.firstName).toBe(entity.firstName);
    expect(model.lastName).toBe(entity.lastName);
    expect(model.externalId).toBe(entity.externalId);
  });
});
