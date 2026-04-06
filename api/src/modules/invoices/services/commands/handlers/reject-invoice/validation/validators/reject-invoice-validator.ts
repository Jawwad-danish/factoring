import { RejectInvoiceRequest } from '@module-invoices/data';
import { InvoiceValidator } from '../../../common/validation';

export type RejectInvoiceValidator = InvoiceValidator<RejectInvoiceRequest>;
