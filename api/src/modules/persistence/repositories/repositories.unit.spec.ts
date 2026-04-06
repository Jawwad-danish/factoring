import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DatabaseService } from '@module-database';
import { Test } from '@nestjs/testing';
import { Repositories } from './repositories';

describe('Repositories', () => {
  const entityManager = createMock<EntityManager>();
  let repositories: Repositories;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [mockMikroORMProvider, Repositories],
    })
      .useMocker((token) => {
        if (token == DatabaseService) {
          return createMock<DatabaseService>({
            getMikroORM: () => {
              return createMock<MikroORM<PostgreSqlDriver>>({
                em: entityManager,
              });
            },
          });
        }
        return mockToken(token);
      })
      .compile();

    repositories = module.get(Repositories);
  });

  it('Should be defined', async () => {
    expect(repositories).toBeDefined();
    expect(repositories.invoice).toBeDefined();
    expect(repositories.reserve).toBeDefined();
  });

  it('Persist calls delegate to EntityManager', async () => {
    const persistSpy = jest.spyOn(entityManager, 'persist');
    repositories.persist({});

    expect(persistSpy.mock.calls.length).toBe(1);
  });
});
