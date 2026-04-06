import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { EmployeeSeeder, UserSeeder } from '@module-seeders';
import { EmployeeRole } from '@module-persistence';

describe('Send reset employee password integration tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let employeeId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();

    await appManager.runTransactionally(async () => {
      const userSeeder = appManager.app.get(UserSeeder);
      const user = await userSeeder.create({});
      const employeeSeeder = appManager.app.get(EmployeeSeeder);
      const employee = await employeeSeeder.create({
        role: EmployeeRole.Underwriter,
        user,
        createdBy: appManager.user,
        updatedBy: appManager.user,
      });
      employeeId = employee.id;
    });
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Should send password reset email for employee', async () => {
    await steps.users.sendResetEmployeePassword(employeeId);
  });

  it('Should return 404 when employee is not found', async () => {
    const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';
    await steps.users.sendResetEmployeePasswordExpectError(
      nonExistentEmployeeId,
      404,
    );
  });
});
