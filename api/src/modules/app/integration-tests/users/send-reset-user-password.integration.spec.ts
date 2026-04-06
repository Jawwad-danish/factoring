import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import {
  ClientFactoringConfigsSeeder,
  EmployeeSeeder,
  UserSeeder,
} from '@module-seeders';
import { EmployeeRole } from '@module-persistence';

describe('Send reset client password request integration tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let clientId: string;
  let employeeClientId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    clientId = appManager.client.id;

    await appManager.runTransactionally(async () => {
      const userSeeder = appManager.app.get(UserSeeder);
      const employeeSeeder = appManager.app.get(EmployeeSeeder);
      const clientFactoringConfigSeeder = appManager.app.get(
        ClientFactoringConfigsSeeder,
      );

      const employeeUser = await userSeeder.create({});
      await employeeSeeder.create({
        role: EmployeeRole.Underwriter,
        user: employeeUser,
        createdBy: appManager.user,
        updatedBy: appManager.user,
      });

      const employeeClientConfig = await clientFactoringConfigSeeder.create({
        user: employeeUser,
      });
      employeeClientId = employeeClientConfig.clientId;
    });
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Should send password reset email for non-employee user', async () => {
    await steps.users.sendResetClientPassword(clientId);
  });

  it('Should return 404 when client not found', async () => {
    await steps.users.sendResetClientPasswordExpectError(
      '00000000-0000-0000-0000-000000000000',
      404,
    );
  });

  it('Should return 400 when user is an employee', async () => {
    await steps.users.sendResetClientPasswordExpectError(employeeClientId, 400);
  });
});
