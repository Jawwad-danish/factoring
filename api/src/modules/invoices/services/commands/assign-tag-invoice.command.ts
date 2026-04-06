import { RequestCommand } from '@module-cqrs';
import { AssignInvoiceActivityRequest, InvoiceTaggedContext } from '../../data';

export type AssignInvoiceActivityCommandOptions = {
  notifyExternalService: boolean;
  clientId: string;
  message: string;
  subject: string;
};

export class AssignInvoiceActivityCommand extends RequestCommand<
  AssignInvoiceActivityRequest,
  InvoiceTaggedContext
> {
  constructor(
    readonly invoiceId: string,
    readonly request: AssignInvoiceActivityRequest,
    readonly options?: AssignInvoiceActivityCommandOptions,
  ) {
    super(request);
  }
}
