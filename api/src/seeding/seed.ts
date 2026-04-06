import { AppSeeder, SeedersModules } from '@module-seeders';
import { NestFactory } from '@nestjs/core';
import { DatabaseService } from '@module-database';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedersModules);
  const appSeeder = app.get(AppSeeder);
  const databaseService = app.get(DatabaseService);
  await databaseService.withRequestContext(async () => {
    await appSeeder.default();
  });
  await app.close();
}

bootstrap();
