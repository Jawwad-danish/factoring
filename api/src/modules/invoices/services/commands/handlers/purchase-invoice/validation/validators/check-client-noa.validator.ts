import { ValidationError } from '@core/validation';
import { ClientDocumentType } from '@module-clients/data';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { Injectable } from '@nestjs/common';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';

@Injectable()
export class CheckClientNoaValidator implements PurchaseInvoiceValidator {
  constructor() {}

  async validate(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<void> {
    const { client } = context;
    const clientNOAAssignment = client.documents.filter(
      (doc) => doc.type === ClientDocumentType.NOTICE_OF_ASSIGNMENT,
    );

    if (clientNOAAssignment.length === 0) {
      throw new ValidationError(
        'noa-documents',
        'Client does not have NOA documents assigned.',
      );
    }
  }
}
