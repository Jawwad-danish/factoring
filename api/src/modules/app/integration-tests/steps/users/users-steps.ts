import { StepsInput } from '../step';
import { UserPasswordResetSteps } from './user-password-reset-steps';

export class UsersSteps {
  private readonly passwordReset: UserPasswordResetSteps;

  constructor(input: StepsInput) {
    this.passwordReset = new UserPasswordResetSteps(input);
  }

  async sendResetEmployeePassword(employeeId: string): Promise<void> {
    return this.passwordReset.sendResetEmployeePassword(employeeId);
  }

  async sendResetEmployeePasswordExpectError(
    employeeId: string,
    expectedStatus: number,
  ): Promise<void> {
    return this.passwordReset.sendResetEmployeePasswordExpectError(
      employeeId,
      expectedStatus,
    );
  }

  async sendResetClientPassword(clientId: string): Promise<void> {
    return this.passwordReset.sendResetClientPassword(clientId);
  }

  async sendResetClientPasswordExpectError(
    clientId: string,
    expectedStatus: number,
  ): Promise<void> {
    return this.passwordReset.sendResetClientPasswordExpectError(
      clientId,
      expectedStatus,
    );
  }
}
