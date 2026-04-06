import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { buildCheckResult } from './util';
import {
  VerificationCheckResult,
  VerificationEngineInput,
  VerificationRequiredCheck,
} from '../verification-engine.types';

@Injectable()
export class FirstInvoiceCheck implements VerificationRequiredCheck {
  private logger = new Logger(FirstInvoiceCheck.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async run(
    context: VerificationEngineInput,
  ): Promise<null | VerificationCheckResult> {
    const { invoice } = context;
    const totalInvoices = await this.invoiceRepository.countByClient(
      invoice.clientId,
    );
    if (totalInvoices === 0) {
      this.logger.debug(
        `Verification is required for invoice id ${invoice.id}. First invoice for client id ${invoice.clientId}`,
      );
      return buildCheckResult(
        'Verification is required. First invoice',
        'FirstInvoice',
        {
          cause: 'FirstInvoice',
          totalInvoices: totalInvoices,
        },
      );
    }
    return null;
  }
}
