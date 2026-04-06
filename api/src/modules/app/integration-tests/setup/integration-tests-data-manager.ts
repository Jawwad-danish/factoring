import {
  ClientBrokerAssignmentSeeder,
  ClientFactoringConfigsSeeder,
  EmployeeSeeder,
  UserSeeder,
} from '@module-seeders';
import Big from 'big.js';
import { ClientSuccessTeamsSeeder } from '../../../seeders/client-success-teams';
import { IntegrationTestsAppManager } from './integration-tests-app-manager';
import { EmployeeRole } from '../../../persistence';

export class IntegrationTestsDataManager {
  constructor(private readonly appManager: IntegrationTestsAppManager) {}

  async setup() {
    await this.appManager.runTransactionally(async () => {
      await this.createClientSuccesTeam();
      await this.createSalesRep();
      await this.createClientFactoringConfig();
      await this.createClientBrokerAssignment();
    });
  }

  private async createClientSuccesTeam() {
    const seeder = this.appManager.app.get(ClientSuccessTeamsSeeder);
    await seeder.create({
      name: `Team 101 - Integration Testing - ${this.appManager.client.id}`,
      createdBy: this.appManager.user,
      updatedBy: this.appManager.user,
    });
  }

  private async createSalesRep() {
    const userSeeder = this.appManager.app.get(UserSeeder);
    const user = await userSeeder.create({});
    const seeder = this.appManager.app.get(EmployeeSeeder);
    await seeder.create({
      role: EmployeeRole.Salesperson,
      user,
      createdBy: this.appManager.user,
      updatedBy: this.appManager.user,
    });
  }

  private async createClientFactoringConfig() {
    const clientFactoringConfigSeeder = this.appManager.app.get(
      ClientFactoringConfigsSeeder,
    );
    const userSeeder = this.appManager.app.get(UserSeeder);
    const user = await userSeeder.create({});
    await clientFactoringConfigSeeder.create({
      createdBy: this.appManager.user,
      updatedBy: this.appManager.user,
      clientId: this.appManager.client.id,
      reserveRatePercentage: Big(1),
      doneSubmittingInvoices: true,
      user: user,
    });
  }

  private async createClientBrokerAssignment() {
    const clientFactoringConfigSeeder = this.appManager.app.get(
      ClientBrokerAssignmentSeeder,
    );
    clientFactoringConfigSeeder.create({
      createdBy: this.appManager.user,
      updatedBy: this.appManager.user,
      clientId: this.appManager.client.id,
      brokerId: this.appManager.broker.id,
    });
  }
}
