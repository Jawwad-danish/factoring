import 'tsconfig-paths/register'; // https://github.com/facebook/jest/issues/11644#issuecomment-1171646729
import { DatabaseModule, DatabaseService } from '@module-database';
import { NestFactory } from '@nestjs/core';

module.exports = async () => {
  if (process.env.JEST_TESTS_TYPE === 'integration') {
    console.log('Cleaning up integration testing database');
    const app = await NestFactory.createApplicationContext(DatabaseModule);
    const databaseService = app.get(DatabaseService);
    const mikroORM = databaseService.getMikroORM();
    const result = await mikroORM.em.execute(
      `select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const tableNames = result.map((result) => result.table_name);

    const staticTables = [
      'migrations',
      'tag_definitions',
      'tag_definition_group',
      'tag_group_assoc',
      'client_status_reason_configs',
      'client_reserve_rate_reasons',
      'client_factoring_rate_reasons',
      'client_success_teams',
      'users',
      'maintenance',
    ];
    for (const tableName of tableNames) {
      if (!staticTables.includes(tableName)) {
        await mikroORM.em.execute(`TRUNCATE public.${tableName} CASCADE`);
      }
    }
    await app.close();
  }
};
