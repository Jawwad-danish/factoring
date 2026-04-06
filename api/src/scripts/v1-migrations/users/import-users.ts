import { environment } from '@core/environment';
import { AppModule } from '@module-app';
import { DatabaseService } from '@module-database';
import { EmployeeEntity, UserEntity } from '@module-persistence/entities';
import { NestFactory } from '@nestjs/core';
import path from 'path';
import {
  ImportReport,
  OnConflictStrategy,
  importEntities,
  referenceUserData,
  run,
} from '../../util';
import { buildEmployeeEntity, buildEntity } from './user-mapper';
import {
  EmployeeRepository,
  UserRepository,
} from '@module-persistence/repositories';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_USERS_PATH',
);
const report = new ImportReport();

const importUsers = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const userRepository = app.get(UserRepository);
  const employeeRepository = app.get(EmployeeRepository);
  await importEntities<UserEntity>({
    path: path.resolve(PATH),
    report: report.ofDomain('users'),
    mapperFn: (item, em) => {
      if (item.email === 'system@bobtail.com') {
        return null;
      }
      const entity = buildEntity(item);
      referenceUserData(entity, {}, em);
      return entity;
    },
    dependencies: { databaseService, repository: userRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });

  await importEntities<EmployeeEntity>({
    path: path.resolve(PATH),
    report: report.ofDomain('users'),
    mapperFn: (item, em) => {
      if (item.employee === null || item.email === 'system@bobtail.com') {
        return null;
      }
      const entity = buildEmployeeEntity(item.employee);
      entity.user = em.getReference(UserEntity, item.id);
      referenceUserData(entity, {}, em);
      return entity;
    },
    dependencies: { databaseService, repository: employeeRepository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

run(importUsers, report, __dirname);
