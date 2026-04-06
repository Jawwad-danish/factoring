import { environment } from '@core/environment';
import _ from 'lodash';
import { DomainReport, FileReport, getFiles, parseJSON, run } from '../../util';

import { ClientsModule } from '@module-clients';
import { DatabaseService } from '@module-database';
import { UserEntity, UserRepository } from '@module-persistence';
import { NestFactory } from '@nestjs/core';
import axios from 'axios';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_USERS_PATH',
);
const report = new DomainReport('auth0-roles');

type UserData = {
  email: string;
  roles: Roles[];
};
// TO BE COMPLETED BEFORE RUNNING THE SCRIPT
const MANAGEMENT_API_TOKEN = '';
const AUTH0DOMAIN = '';
enum Roles { // role ids from auth0
  Employee = '',
}

const runAgainstDb = async () => {
  const app = await NestFactory.createApplicationContext(ClientsModule);
  const userRepository = app.get(UserRepository);
  const databaseService = app.get(DatabaseService);
  await databaseService.withRequestContext(
    async () => await assignUserRoles(userRepository),
  );
};

const assignUserRoles = async (userRepository: UserRepository) => {
  const files = getFiles(PATH);
  for (const file of files) {
    const data = parseJSON(file, report);
    const fileReport = report.ofFile(file);
    if (data) {
      for (const rawUser of data) {
        const user: UserData = {
          email: rawUser.email,
          roles: determineRoles(rawUser),
        };
        if (user.roles.length > 0) {
          await doRoleAssignment(user, userRepository, fileReport);
        }
      }
    }
  }
};

const doRoleAssignment = async (
  user: UserData,
  userRepository: UserRepository,
  report: FileReport,
) => {
  report.incrementCountItemsForMapping();

  try {
    let externalId = '';
    const dbUser = await getUserFromDatabase(user.email, userRepository);
    if (dbUser && dbUser.externalId) {
      externalId = dbUser.externalId;
    } else {
      const auth0UserId = await getUserExternalIdFromAuth0(user.email);
      if (auth0UserId) {
        externalId = auth0UserId;
        if (dbUser) {
          dbUser.externalId = auth0UserId;
          await userRepository.upsertAndFlush(dbUser, {
            onConflictAction: 'merge',
          });
        }
      }
    }
    if (externalId) {
      await assignRolesInAuth0(externalId, user.roles);
    } else {
      console.log(
        `Could not assign roles to user ${user.email}. User not found in database or auth0`,
      );
      report.addFailedSavedEntityId(
        user.email,
        'User not found in database or auth0',
      );
    }
  } catch (error) {
    console.log('ERROR', error);
    report.addFailedSavedEntityId(user.email, error);
  }
};

const determineRoles = (rawUser: any): Roles[] => {
  const roles: Roles[] = [];
  if (!_.isEmpty(rawUser.employee)) {
    roles.push(Roles.Employee);
  }
  return roles;
};

const assignRolesInAuth0 = async (
  id: string,
  roles: Roles[],
): Promise<void> => {
  const url = `https://${AUTH0DOMAIN}/api/v2/users/${id}/roles`;
  const data = { roles: roles };
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
    'cache-control': 'no-cache',
  };

  try {
    await axios.post(url, data, {
      headers,
    });
  } catch (error) {
    console.log(`Roles ${roles} were not assigned to user ${id}`);
    console.log(error);
    throw error;
  }
};

const getUserFromDatabase = async (
  email: string,
  userRepository: UserRepository,
): Promise<UserEntity | null> => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    console.log(`Could not find user in database by email ${email}`);
    return null;
  }
  return user;
};

const getUserExternalIdFromAuth0 = async (
  email: string,
): Promise<string | null> => {
  console.log(`Retrieving user id from auth0 for user ${email}`);
  const url = `https://${AUTH0DOMAIN}/api/v2/users-by-email`;
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
    'cache-control': 'no-cache',
  };
  const params = {
    email: email,
  };
  try {
    const response = await axios.get(url, {
      headers,
      params,
    });
    return response.data[0]?.user_id ?? null;
  } catch (error) {
    console.log(`Could not get user by email ${email} from auth0 API`);
    console.log(error);
    throw error;
  }
};

run(runAgainstDb, report, __dirname);
