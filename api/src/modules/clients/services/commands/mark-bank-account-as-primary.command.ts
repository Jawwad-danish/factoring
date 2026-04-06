import {
  ClientBankAccount,
  ClientBankAccountMarkPrimaryRequest,
} from '@fs-bobtail/factoring/data';
import { RequestCommand } from '@module-cqrs';

export class MarkBankAccountAsPrimaryCommand extends RequestCommand<
  ClientBankAccountMarkPrimaryRequest,
  ClientBankAccount
> {
  constructor(
    readonly clientId: string,
    readonly bankAccountId: string,
    request: ClientBankAccountMarkPrimaryRequest,
  ) {
    super(request);
  }
}
