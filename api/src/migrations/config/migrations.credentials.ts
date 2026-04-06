import { NestFactory } from '@nestjs/core';
import { firstValueFrom } from 'rxjs';
import { MigrationModule } from './migrations.module';
import {
  DatabaseCredentials,
  DatabaseCredentialService,
} from '../../modules/database/database-credentials.service';

export const getDatabaseCredentials =
  async (): Promise<DatabaseCredentials> => {
    const migrationModule = await NestFactory.createApplicationContext(
      MigrationModule,
    );
    const credentialsService = migrationModule.get(DatabaseCredentialService);
    const source = credentialsService.observe();
    const credentials = await firstValueFrom(source);
    await migrationModule.close();
    return credentials;
  };
