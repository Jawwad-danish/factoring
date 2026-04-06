import { ValidationError, Validator } from '@core/validation';
import { InvoiceRepository, ReserveRepository } from '@module-persistence';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { ValidationInput } from './update-client-factoring-config-validation.service';

@Injectable()
export class ClientStatusChangeValidator implements Validator<ValidationInput> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly reserveRepository: ReserveRepository,
  ) {}

  async validate(context: ValidationInput): Promise<void> {
    const { status } = context[0];

    // If there's atleast one invoice with status set as approved
    if (status === ClientFactoringStatus.Released) {
      const clientInovice =
        await this.invoiceRepository.getClientInvoiceUnderApprovedStatus(
          context[1].clientId,
        );

      if (clientInovice) {
        throw new ValidationError(
          'client-status-change',
          `Cannot update client status to ${status.toLocaleUpperCase()} when there are approved invoices.`,
        );
      }

      // If the total client balance is negative
      const clientTotalBalance = await this.reserveRepository.getTotalByClient(
        context[1].clientId,
      );

      if (clientTotalBalance < 0) {
        throw new ValidationError(
          'client-status-change',
          `Cannot update client status to ${status?.toLocaleUpperCase()} when there is negative balance.`,
        );
      }

      // If the total number of write off reasons equal to write off removed
      const [writeOffCount, writeOffRemovedCount] =
        await this.reserveRepository.getWriteOffReserveStatus(
          context[1].clientId,
        );

      if ((writeOffCount?.count ?? 0) !== (writeOffRemovedCount?.count ?? 0)) {
        throw new ValidationError(
          'client-status-change',
          `Cannot update client status to ${status?.toLocaleUpperCase()} when there is write off balance.`,
        );
      }
    }
  }
}
