import { Provider } from '@nestjs/common';
import { DatabaseCredentialService } from './database-credentials.service';
import { DatabaseService } from './database.service';

export const databaseServiceProvider: Provider = {
  provide: DatabaseService,
  useFactory: async (databaseCredentialsService: DatabaseCredentialService) => {
    const service = new DatabaseService(databaseCredentialsService);
    await service.connect();
    return service;
  },
  inject: [DatabaseCredentialService],
};
