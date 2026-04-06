import { CrossCuttingConcerns } from '@core/util';
import {
  ClientBankAccount,
  ClientBankAccountMarkPrimaryRequest,
  ClientBankAccountStatus,
  ProductName,
} from '@fs-bobtail/factoring/data';
import { CommandRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { Injectable, Logger } from '@nestjs/common';
import { ClientApi } from '../api';
import { CreateBankAccountRequest } from '../api/data';
import {
  CreateClientBankAccountCommand,
  MarkBankAccountAsPrimaryCommand,
} from './commands';
import {
  ClientBankAccountCreateError,
  ClientBankAccountMissingError,
} from './errors';

const OBSERVABILITY_TAG = 'client-bank-account-service';

interface GetBankAccountByIdOptions {
  shouldMask?: boolean;
  product?: ProductName;
  primary?: boolean;
}

@Injectable()
export class ClientBankAccountService {
  private logger = new Logger(ClientBankAccountService.name);

  constructor(
    private readonly clientApi: ClientApi,
    private readonly commandRunner: CommandRunner,
  ) {}

  getPrimaryFactoringBankAccountById(clientId: string, bankAccountId: string) {
    return this.getBankAccountById(clientId, bankAccountId, {
      primary: true,
      product: ProductName.Factoring,
      shouldMask: false,
    });
  }

  @CrossCuttingConcerns<ClientBankAccountService, 'getBankAccountById'>({
    error: {
      errorSupplier: (cause: Error, clientId: string, bankAccountId: string) =>
        new ClientBankAccountMissingError(clientId, bankAccountId, cause),
    },
    logging: (clientId: string, bankAccountId: string) => {
      return {
        message: `Fetching bank account ${bankAccountId} for client ${clientId}`,
        payload: {
          clientId,
          bankAccountId,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'get-bank-account-by-id'],
    },
  })
  async getBankAccountById(
    clientId: string,
    bankAccountId: string,
    options?: GetBankAccountByIdOptions,
  ): Promise<ClientBankAccount> {
    const bankAccount = await this.clientApi.findBankAccountById(
      clientId,
      bankAccountId,
      options?.shouldMask ?? true,
    );

    if (!bankAccount) {
      this.logger.error(
        `Could not find bank account with ID ${bankAccountId} for client with ID ${clientId}`,
        {
          bankAccountId,
          clientId,
        },
      );
      throw new Error(`Could not find bank account by identifier`);
    }

    if (
      options?.product &&
      !bankAccount.products?.some((product) => product.name === options.product)
    ) {
      this.logger.error(
        `Could not find bank account with ID ${bankAccountId} for client with ID ${clientId} for product ${options.product}`,
        {
          bankAccountId,
          clientId,
          product: options.product,
        },
      );
      throw new Error(`Could not find bank account by identifier`);
    }

    if (
      options?.primary &&
      bankAccount.status !== ClientBankAccountStatus.Active
    ) {
      this.logger.error(
        `Could not find bank account with ID ${bankAccountId} for client with ID ${clientId} as primary`,
        {
          bankAccountId,
          clientId,
          primary: options.primary,
        },
      );
      throw new Error(`Could not find bank account by identifier`);
    }

    return bankAccount;
  }

  @Transactional('create-client-bank-account')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new ClientBankAccountCreateError(cause),
    },
    logging: () => ({ message: 'Creating bank account' }),
    observability: { tag: [OBSERVABILITY_TAG, 'create'] },
  })
  async createClientBankAccount(
    id: string,
    request: CreateBankAccountRequest,
  ): Promise<ClientBankAccount> {
    request.clientId = id;
    return await this.commandRunner.run(
      new CreateClientBankAccountCommand(request),
    );
  }

  @Transactional('mark-bank-account-as-primary')
  @CrossCuttingConcerns({
    logging: () => ({ message: 'Marking bank account as primary' }),
    observability: { tag: [OBSERVABILITY_TAG, 'mark-as-primary'] },
  })
  async markBankAccountAsPrimary(
    clientId: string,
    bankAccountId: string,
    request: ClientBankAccountMarkPrimaryRequest,
  ): Promise<ClientBankAccount> {
    return await this.commandRunner.run(
      new MarkBankAccountAsPrimaryCommand(clientId, bankAccountId, request),
    );
  }
}
