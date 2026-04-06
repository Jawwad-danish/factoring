import { QuickBooks } from '@balancer-team/quickbooks';
import {
  Account,
  Customer,
  JournalEntry,
  Token,
} from '@balancer-team/quickbooks/dist/schemas';
import { CrossCuttingConcerns } from '@core/util';
import { QuickbooksTokensRepository } from '@module-persistence';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { QuickbooksApiError } from './errors';
import { QUICKBOOKS_CLIENT } from './quickbooks-client.provider';

const OBSERVABILITY_TAG = 'quickbooks-api';

interface QuickbooksApiErrorResponse {
  Fault: {
    Error: {
      Message: string;
      Detail: string;
      code: string;
      element: string;
    }[];
  };
}

@Injectable()
export class QuickbooksApi {
  private token: Token | null = null;
  private returnUrl = '';

  constructor(
    @Inject(QUICKBOOKS_CLIENT) private readonly client: QuickBooks,
    private readonly quickbooksTokensRepository: QuickbooksTokensRepository,
  ) {}

  async getAuthorizationUrl(returnUrl: string): Promise<string> {
    this.returnUrl = returnUrl;
    return this.client.getAuthUrl();
  }

  async finishAuth(
    code: string,
    state: string,
    realmId: string,
  ): Promise<string> {
    const token = await this.client.getTokenFromGrant({
      code,
      state,
      realmId,
    });
    this.token = token;
    await this.saveTokenFromDatabase(token);
    return this.returnUrl;
  }

  async getCustomerById(customerId: string): Promise<Customer | null> {
    const result = await this.query(
      `SELECT * FROM Customer WHERE Id = '${customerId}'`,
    );
    if (!result.QueryResponse.Customer) {
      return null;
    }
    const customers = result.QueryResponse.Customer as Customer[];
    if (customers.length === 0) {
      return null;
    }
    return customers[0];
  }

  async getCustomerByName(name: string): Promise<Customer | null> {
    const result = await this.query(
      `SELECT * FROM Customer WHERE DisplayName = '${name}'`,
    );
    if (!result.QueryResponse.Customer) {
      return null;
    }
    const customers = result.QueryResponse.Customer as Customer[];
    if (customers.length === 0) {
      return null;
    }
    return customers[0];
  }

  @CrossCuttingConcerns({
    logging: (customer: Customer) => {
      return {
        message: `Creating customer in quickbooks API with name ${customer.DisplayName}`,
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create-customer'],
    },
  })
  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const result = await this.post('/customer', customer);
    return result.Customer as Customer;
  }

  async updateCustomer(
    customer: Pick<Customer, 'Id' | 'SyncToken'> & Partial<Customer>,
  ): Promise<Customer> {
    const result = await this.post(`/customer`, customer);
    return result.Customer as Customer;
  }

  async getAccounts(): Promise<Account[]> {
    const result = await this.query('SELECT * FROM Account');
    return result.QueryResponse.Account as Account[];
  }

  @CrossCuttingConcerns({
    logging: (journalEntry: JournalEntry) => {
      return {
        message: `Creating journal entry in quickbooks API with doc number ${journalEntry.DocNumber}`,
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create-journal-entry'],
    },
  })
  async createJournalEntry(journalEntry: JournalEntry): Promise<JournalEntry> {
    const result = await this.post('/journalentry', journalEntry);
    return result.JournalEntry;
  }

  private async query(query: string): Promise<any> {
    const token = await this.getToken();
    const result = await this.client.query({
      token: token,
      query,
    });
    this.maybeThrowError(result);
    return result;
  }

  private async post<T>(endpoint: string, body: T): Promise<any> {
    const token = await this.getToken();
    const result = await this.client.post({
      token: token,
      endpoint,
      body,
    });
    this.maybeThrowError(result);
    return result;
  }

  private maybeThrowError(apiResponse: any): void {
    if (apiResponse.Fault) {
      const errorResponse = apiResponse as QuickbooksApiErrorResponse;
      const message = errorResponse.Fault.Error.map((e) => `${e.Message}`).join(
        ', ',
      );
      throw new QuickbooksApiError(message);
    }
  }

  private async getToken(): Promise<Token> {
    if (!this.token) {
      this.token = await this.loadTokenFromDatabase();
    }

    if (!this.client.isRefreshTokenValid(this.token)) {
      throw new UnauthorizedException(
        'Invalid refresh token. Please re-authenticate.',
      );
    }

    const validToken = await this.client.getValidToken(this.token);

    if (validToken.access_token !== this.token.access_token) {
      this.token = validToken;
      await this.saveTokenFromDatabase(validToken);
    }

    return validToken;
  }

  private async loadTokenFromDatabase(): Promise<Token> {
    const cachedToken = await this.quickbooksTokensRepository.getToken();

    if (!cachedToken) {
      throw new UnauthorizedException('Authentication required.');
    }

    return cachedToken;
  }

  private async saveTokenFromDatabase(token: Token): Promise<void> {
    await this.quickbooksTokensRepository.setToken(token);
  }
}
