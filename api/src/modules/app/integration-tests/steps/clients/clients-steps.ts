import {
  CreateClientFactoringConfigRequest,
  UpdateClientFactoringConfigRequest,
} from '@module-clients';
import { DatabaseService } from '@module-database';
import {
  ClientSuccessTeamRepository,
  EmployeeRepository,
} from '@module-persistence';
import { StepsInput } from '../step';
import { ClientOverviewSteps } from './client-overview-steps';
import { CreateClientFactoringConfigSteps } from './create-client-factoring-config-steps';
import { UpdateClientFactoringConfigSteps } from './update-client-factoring-config-steps';

export class ClientsSteps {
  private readonly overviewSteps: ClientOverviewSteps;
  private readonly createClientFactoringConfigSteps: CreateClientFactoringConfigSteps;
  private readonly updateClientFactoringConfigSteps: UpdateClientFactoringConfigSteps;

  constructor(readonly input: StepsInput) {
    this.overviewSteps = new ClientOverviewSteps(input);
    this.createClientFactoringConfigSteps =
      new CreateClientFactoringConfigSteps(input);
    this.updateClientFactoringConfigSteps =
      new UpdateClientFactoringConfigSteps(input);
  }

  overview(clientId: string) {
    return this.overviewSteps.get(clientId);
  }

  createClientFactoringConfig(
    createRequest: CreateClientFactoringConfigRequest,
  ) {
    return this.createClientFactoringConfigSteps.create(createRequest);
  }

  updateClientFactoringConfig(
    clientId: string,
    request: UpdateClientFactoringConfigRequest,
  ) {
    return this.updateClientFactoringConfigSteps.update(clientId, request);
  }

  async getClientSuccessteamId(): Promise<string> {
    const { app } = this.input;
    const databaseService = app.get(DatabaseService);
    const clientSuccessTeamRepository = app.get(ClientSuccessTeamRepository);
    const clientSuccessTeams = await databaseService.withRequestContext(
      async () => {
        return await clientSuccessTeamRepository.findAll();
      },
    );

    return clientSuccessTeams[0][0].id;
  }

  async getSalesRepId(): Promise<string> {
    const { app } = this.input;
    const databaseService = app.get(DatabaseService);
    const employeeRepository = app.get(EmployeeRepository);
    const employees = await databaseService.withRequestContext(async () => {
      return await employeeRepository.findAll();
    });

    return employees[0][0].id;
  }
}
