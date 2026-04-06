import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { InvoiceValidator } from '../../../common/validation';

export type CreateInvoiceValidator = InvoiceValidator<CreateInvoiceRequest>;
