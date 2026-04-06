import { AppContextHolder } from '@core/app-context';
import {
  ClientFactoringConfigsRepository,
  EmployeeRepository,
  InvoiceRepository,
} from '@module-persistence';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class InvoicesGuard implements CanActivate {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = AppContextHolder.get().getAuthentication().principal.id;
    const invoiceId = request.params.invoiceId || request.params.id;
    return (
      (await this.isEmployeeUser(userId)) ||
      (await this.isInvoiceClientUser(invoiceId, userId))
    );
  }

  private async isInvoiceClientUser(invoiceId: string, userId: string) {
    const invoice = await this.invoiceRepository.getOneById(invoiceId);
    const clientFactoringConfig =
      await this.clientFactoringConfigRepository.findOneByClientId(
        invoice.clientId,
      );
    if (!clientFactoringConfig) {
      throw new Error(
        `Could not find client factoring config for invoice with id: ${invoiceId}`,
      );
    }
    return userId === clientFactoringConfig.userId;
  }

  private async isEmployeeUser(userId: string) {
    const employee = await this.employeeRepository.findOneByUserId(userId);
    return !!employee;
  }
}
