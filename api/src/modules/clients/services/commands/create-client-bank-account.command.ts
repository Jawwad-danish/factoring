import { ClientBankAccount } from '@fs-bobtail/factoring/data';
import { RequestCommand } from '@module-cqrs';
import { CreateBankAccountRequest } from '../../api/data';

export class CreateClientBankAccountCommand extends RequestCommand<
  CreateBankAccountRequest,
  ClientBankAccount
> {
  constructor(request: CreateBankAccountRequest) {
    super(request);
  }
}
