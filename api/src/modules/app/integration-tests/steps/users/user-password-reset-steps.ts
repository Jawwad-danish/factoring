import { testingRequest } from '@core/test';
import { StepsInput } from '../step';

export class UserPasswordResetSteps {
  constructor(private readonly input: StepsInput) {}

  async sendResetEmployeePassword(employeeId: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .post(`/employees/${employeeId}/send-reset-password-request`)
      .expect(204);
  }

  async sendResetEmployeePasswordExpectError(
    employeeId: string,
    expectedStatus: number,
  ): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .post(`/employees/${employeeId}/send-reset-password-request`)
      .expect(expectedStatus);
  }

  async sendResetClientPassword(clientId: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .post(`/clients/${clientId}/send-reset-password-request`)
      .expect(204);
  }

  async sendResetClientPasswordExpectError(
    clientId: string,
    expectedStatus: number,
  ): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .post(`/clients/${clientId}/send-reset-password-request`)
      .expect(expectedStatus);
  }
}
