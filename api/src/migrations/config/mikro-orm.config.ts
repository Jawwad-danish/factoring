import { Options } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/postgresql';
import { registry } from '@module-persistence/entities';
import { getDatabaseCredentials } from './migrations.credentials';
import { Migrator } from '@mikro-orm/migrations';
import { historyRegistry } from '@module-persistence/history';

const MikroOrmConfig = async (): Promise<Options> => {
  const dbCredentials = await getDatabaseCredentials();
  return defineConfig({
    extensions: [Migrator],
    entities: [...registry, ...historyRegistry],
    dbName: dbCredentials.database,
    user: dbCredentials.username,
    password: dbCredentials.password,
    host: process.env.DB_HOST ?? dbCredentials.host,
    port: process.env.DB_PORT
      ? Number(process.env.DB_PORT)
      : dbCredentials.port,
    migrations: {
      tableName: 'migrations',
      path: 'src/migrations/changes',
      transactional: true,
      disableForeignKeys: true,
      allOrNothing: true,
      dropTables: true,
      safe: false,
      emit: 'ts',
      snapshot: false,
    },
  });
};

export default MikroOrmConfig;
