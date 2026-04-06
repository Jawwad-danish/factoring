import { DatabaseService } from '../database.service';

export const mockDatabaseService = (): Partial<DatabaseService> => {
  return {
    getMikroORM: jest.fn(),
  };
};
