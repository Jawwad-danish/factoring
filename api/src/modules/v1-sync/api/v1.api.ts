import { Duration } from '@core/date-time';
import { CrossCuttingConcerns } from '@core/util';
import { HttpClient } from '@core/web';
import { AuthTokenService, UserTokenService } from '@module-auth';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { V1ApiError } from './v1-api.error';
import { V1DeleteInvoiceUpdatesRequest } from './v1.types';

enum Resources {
  Invoice = 'invoices',
  InvoiceDocuments = 'invoicedocuments',
  InvoiceUpdates = 'invoiceupdates',
  Reserve = 'balances',
  ReserveAccountFunds = 'reserveaccount',
  BrokerPayments = 'debtorpayments',
  Clients = 'clients',
  Brokers = 'debtors',
  Cron = 'cron',
  Tenants = 'tenants',
  ProcessingNotes = 'processingnotes',
  ClientDocuments = 'clientdocuments',
  ClientBrokerAssignments = 'clientdebtorassignments',
  Buyouts = 'buyouts',
  Employees = 'employees',
  FirebaseTokens = 'firebasetokens',
  ClientBankAccounts = 'clientbankaccounts',
}

export interface V1ApiOptions {
  timeout: Duration;
}

@Injectable()
export class V1Api {
  // used by @CrossCuttingConcers
  readonly logger: Logger = new Logger(V1Api.name);
  private readonly httpClient: HttpClient;
  private readonly url: string;

  constructor(
    @Inject(CONFIG_SERVICE) configService: ConfigService,
    @Inject(UserTokenService) authTokenService: AuthTokenService,
  ) {
    this.httpClient = new HttpClient('v1-api', authTokenService);
    const v1ApiUrlConfig = configService.getValue('V1_API_URL');
    if (!v1ApiUrlConfig.hasValue()) {
      throw new Error('Could not obtain V1_API config value');
    }
    const configUrl = v1ApiUrlConfig.asString();
    this.url = configUrl.endsWith('/') ? configUrl.slice(0, -1) : configUrl;
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create invoice',
        payload: body,
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-create-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'create-invoice'],
    },
  })
  createInvoice(body: object, options?: V1ApiOptions): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.Invoice), {
      request: { body },
      response: {
        mapper(bodyData) {
          return { ...bodyData.data };
        },
      },
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  getInvoice(id: string): Promise<any> {
    return this.httpClient.get(this.buildUrl(Resources.Invoice, id), {
      response: {
        mapper(bodyData) {
          return bodyData;
        },
      },
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update invoice',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-update-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'update-invoice'],
    },
  })
  updateInvoice(
    id: string,
    body: object,
    options?: V1ApiOptions,
  ): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Invoice, id), {
      request: {
        body: body,
      },
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 delete invoice',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-delete-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-invoice'],
    },
  })
  deleteInvoice(id: string, options?: V1ApiOptions): Promise<any> {
    return this.httpClient.delete(this.buildUrl(Resources.Invoice, id), {
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 regenerate invoice document',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-regenerate-invoice-document', cause),
    },
    observability: {
      tag: ['v1-api', 'regenerate-invoice-document'],
    },
  })
  regenerateInvoiceDocument(id: string): Promise<any> {
    return this.httpClient.get(
      this.buildUrl(Resources.InvoiceDocuments, 'regenerate-pdf', id),
      {
        response: {},
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 purchase invoice',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-purchase-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'purchase-invoice'],
    },
  })
  purchaseInvoice(
    id: string,
    body: object,
    options?: V1ApiOptions,
  ): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Invoice, id), {
      request: {
        body: body,
      },
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 purchase buyouts',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-purchase-buyouts', cause),
    },
    observability: {
      tag: ['v1-api', 'purchase-buyouts'],
    },
  })
  purchaseBuyouts(buyoutIds: string[], options?: V1ApiOptions): Promise<any> {
    return this.httpClient.post(
      this.buildUrl(Resources.Buyouts, 'bulk-approve'),
      {
        request: {
          body: { ids: buyoutIds },
        },
        response: {},
        timeout: options?.timeout.toMilliseconds().asNumber(),
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update buyout',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-update-buyout', cause),
    },
    observability: {
      tag: ['v1-api', 'update-buyout'],
    },
  })
  updateBuyout(id: string, body: object, options?: V1ApiOptions): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Buyouts, id), {
      request: {
        body: body,
      },
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 delete buyout',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-delete-buyout', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-buyout'],
    },
  })
  deleteBuyout(id: string): Promise<any> {
    return this.httpClient.delete(this.buildUrl(Resources.Buyouts, id), {
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 verify invoice',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-verify-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'verify-invoice'],
    },
  })
  verifyInvoice(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Invoice, id), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 wait on verification invoice',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-wait-on-verification-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'wait-on-verification'],
    },
  })
  waitOnVerificationInvoice(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.InvoiceUpdates), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 reject invoice',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-reject-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'reject-invoice'],
    },
  })
  rejectInvoice(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Invoice, id), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 revert invoice',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-revert-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'revert-invoice'],
    },
  })
  revertInvoice(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Invoice, id), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 assign tag invoice',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-assign-tag-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'assign-tag-invoice'],
    },
  })
  assignTagInvoice(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.InvoiceUpdates), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 get invoice update',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-get-invoice-update', cause),
    },
    observability: {
      tag: ['v1-api', 'get-invoice-update'],
    },
  })
  getInvoiceUpdate(id: string): Promise<any> {
    return this.httpClient.get(this.buildUrl(Resources.InvoiceUpdates, id), {
      response: {
        mapper(bodyData) {
          return bodyData;
        },
      },
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 delete tag invoice',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-delete-tag-invoice', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-tag-invoice'],
    },
  })
  deleteInvoiceUpdate(
    id: string,
    body?: V1DeleteInvoiceUpdatesRequest,
  ): Promise<any> {
    return this.httpClient.delete(
      this.buildUrl(Resources.InvoiceUpdates, id),
      body
        ? {
            request: {
              body: body,
            },
            response: {},
          }
        : undefined,
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 create invoice document',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-invoice-document', cause),
    },
    observability: {
      tag: ['v1-api', 'create-invoice-document'],
    },
  })
  createInvoiceDocument(body: object, options?: V1ApiOptions): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.InvoiceDocuments), {
      request: {
        body: body,
      },
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 delete invoice document',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-delete-invoice-document', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-invoice-document'],
    },
  })
  deleteInvoiceDocument(id: string, options?: V1ApiOptions): Promise<any> {
    return this.httpClient.delete(
      this.buildUrl(Resources.InvoiceDocuments, id),
      {
        response: {},
        timeout: options?.timeout.toMilliseconds().asNumber(),
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 get invoice document',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-get-invoice-document', cause),
    },
    observability: {
      tag: ['v1-api', 'get-invoice-document'],
    },
  })
  getInvoiceDocument(id: string): Promise<any> {
    return this.httpClient.get(this.buildUrl(Resources.InvoiceDocuments, id), {
      response: {
        mapper(bodyData) {
          return bodyData;
        },
      },
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update invoice document',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-update-invoice-document', cause),
    },
    observability: {
      tag: ['v1-api', 'update-invoice-document'],
    },
  })
  async updateInvoiceDocument(
    id: string,
    body: object,
    timeout?: Duration,
  ): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.InvoiceDocuments, id), {
      request: {
        body: body,
      },
      response: {},
      timeout: timeout?.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create reserve',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-create-reserve', cause),
    },
    observability: {
      tag: ['v1-api', 'create-reserve'],
    },
  })
  createReserve(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.Reserve), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 delete reserve',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-delete-reserve', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-reserve'],
    },
  })
  deleteReserve(id: string): Promise<any> {
    return this.httpClient.delete(this.buildUrl(Resources.Reserve, id));
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create reserve account funds',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-reserve-account-funds', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-create-reserve-account-funds'],
    },
  })
  createReserveAccountFunds(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.ReserveAccountFunds), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create broker payment',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-broker-payment', cause),
    },
    observability: {
      tag: ['v1-api', 'create-broker-payment'],
    },
  })
  createBrokerPayment(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.BrokerPayments), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 update broker payment',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-update-broker-payment', cause),
    },
    observability: {
      tag: ['v1-api', 'update-broker-payment'],
    },
  })
  updateBrokerPayment(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.BrokerPayments, id), {
      request: {
        body: body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 delete broker payment',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-delete-broker-payment', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-broker-payment'],
    },
  })
  deleteBrokerPayment(id: string): Promise<any> {
    return this.httpClient.delete(this.buildUrl(Resources.BrokerPayments, id));
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update client',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-update-client', cause),
    },
    observability: {
      tag: ['v1-api', 'update-client'],
    },
  })
  updateClient(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Clients, id), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 post expedite transfer',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-post-client-expedite', cause),
    },
    observability: {
      tag: ['v1-api', 'post-client-expedite'],
    },
  })
  initiateExpediteTransfer(
    clientId: string,
    body: object,
    options?: V1ApiOptions,
  ): Promise<any> {
    const url = this.buildUrl(Resources.Cron, 'wire', clientId);
    return this.httpClient.post(url, {
      request: {
        body,
      },
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 post regular transfer',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-post-client-regular', cause),
    },
    observability: {
      tag: ['v1-api', 'post-client-regular'],
    },
  })
  initiateRegularTransfer(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.Cron, 'admin-nacha'), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 post debit regular transfer',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-post-debit-regular', cause),
    },
    observability: {
      tag: ['v1-api', 'post-debit-regular'],
    },
  })
  initiateDebitTransfer(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.Cron, 'debit-nacha'), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update maintenance mode',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-update-maintenance-mode', cause),
    },
    observability: {
      tag: ['v1-api', 'update-maintenance-mode'],
    },
  })
  updateMaintenanceMode(body: object): Promise<any> {
    return this.httpClient.put(
      this.buildUrl(Resources.Tenants, '/update-maintenance-mode'),
      {
        request: {
          body,
        },
        response: {},
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 create processing notes',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-processing-notes', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-create-processing-notes'],
    },
  })
  createProcessingNotes(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.ProcessingNotes), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update processing notes',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-update-processing-notes', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-update-processing-notes'],
    },
  })
  updateProcessingNotes(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.ProcessingNotes, id), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 delete processing notes',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-delete-processing-notes', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-delete-processing-notes'],
    },
  })
  deleteProcessingNotes(id: string): Promise<any> {
    return this.httpClient.delete(
      this.buildUrl(Resources.ProcessingNotes, id),
      {
        response: {},
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 get processing notes',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-get-processing-notes', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-get-processing-notes'],
    },
  })
  findProcessingNotes(params: object): Promise<any> {
    const queryParams = new URLSearchParams({ ...params });
    return this.httpClient.get(this.buildUrl(Resources.ProcessingNotes), {
      request: { queryParams: queryParams },
      response: { mapper: (response) => response.rows },
    });
  }

  private buildUrl(...segment: string[]) {
    if (segment.length > 1) {
      return `${this.url}/${segment.join('/')}`;
    }
    if (segment.length === 1) {
      return `${this.url}/${segment[0]}`;
    }
    return this.url;
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update broker',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-update-broker', cause),
    },
    observability: {
      tag: ['v1-api', 'update-broker'],
    },
  })
  updateBroker(id: string, body: object): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.Brokers, id), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create buyouts batch',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-buyouts-batch', cause),
    },
    observability: {
      tag: ['v1-api', 'create-buyouts-batch'],
    },
  })
  createBuyoutsBatch(body: object): Promise<any> {
    return this.httpClient.post(
      `${this.buildUrl(Resources.Buyouts)}/batch-create`,
      {
        request: {
          body: body,
        },
        response: {},
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create employee',
        payload: {
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-create-employee', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-create-employee'],
    },
  })
  createEmployee(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.Employees), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update client document',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-update-client-document', cause),
    },
    observability: {
      tag: ['v1-api', 'update-client-document'],
    },
  })
  async updateClientDocument(
    id: string,
    body: object,
    options?: V1ApiOptions,
  ): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.ClientDocuments, id), {
      request: {
        body: body,
      },
      response: {},
      timeout: options?.timeout.toMilliseconds().asNumber(),
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 get client document',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-get-client-document', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-get-client-document'],
    },
  })
  async getClientDocument(id: string): Promise<any> {
    return this.httpClient.put(this.buildUrl(Resources.ClientDocuments, id), {
      response: { mapper: (response) => response.data },
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 get client-broker assignment',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-get-client-broker-assignment', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-get-client-broker-assignment'],
    },
  })
  async getAssignment(clientId: string, brokerId: string): Promise<any> {
    return this.httpClient.get(
      this.buildUrl(
        Resources.ClientBrokerAssignments,
        `get-client-debtor-assignment`,
        `${clientId}/${brokerId}`,
      ),
      {
        response: { mapper: (data) => data },
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string) => {
      return {
        message: 'V1 release client-broker assignment',
        payload: {
          id,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-release-client-broker-assignment', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-release-client-broker-assignment'],
    },
  })
  async releaseAssignment(
    id: string,
    clientId: string,
    brokerId: string,
  ): Promise<any> {
    const payload = {
      id: id,
      clientId: clientId,
      debtorId: brokerId,
      status: 'released',
    };
    return this.httpClient.put(
      this.buildUrl(Resources.ClientBrokerAssignments, `${id}`),
      {
        request: {
          body: payload,
        },
        response: { mapper: (response) => response.data },
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 create firebase token',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-firebase-token', cause),
    },
    observability: {
      tag: ['v1-api', 'create-firebase-token'],
    },
  })
  createFirebaseToken(body: object): Promise<any> {
    return this.httpClient.post(this.buildUrl(Resources.FirebaseTokens), {
      request: {
        body,
      },
      response: {},
    });
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 delete firebase token',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-delete-firebase-token', cause),
    },
    observability: {
      tag: ['v1-api', 'delete-firebase-token'],
    },
  })
  deleteFirebaseToken(token: string): Promise<any> {
    return this.httpClient.delete(
      this.buildUrl(Resources.FirebaseTokens, token),
      {
        response: {},
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 message contacts',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-message-contacts', cause),
    },
    observability: {
      tag: ['v1-api', 'v1-message-contacts'],
    },
  })
  messageContacts(clientId: string, body: object): Promise<any> {
    return this.httpClient.post(
      this.buildUrl(Resources.Clients, 'message-contacts', clientId),
      {
        request: {
          body: body,
        },
        response: {},
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 create client debtor assignment',
        payload: body,
      };
    },
    error: {
      errorSupplier: (cause) =>
        new V1ApiError('v1-create-client-debtor-assignment', cause),
    },
    observability: {
      tag: ['v1-api', 'create-client-debtor-assignment'],
    },
  })
  createClientDebtorAssignment(
    body: object,
    options?: V1ApiOptions,
  ): Promise<any> {
    return this.httpClient.post(
      this.buildUrl(Resources.ClientBrokerAssignments),
      {
        request: { body },
        response: {
          mapper(bodyData) {
            return bodyData;
          },
        },
        timeout: options?.timeout.toMilliseconds().asNumber(),
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (body: object) => {
      return {
        message: 'V1 resent noa email',
        payload: body,
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-resend-noa-email', cause),
    },
    observability: {
      tag: ['v1-api', 'resend-noa-email'],
    },
  })
  resendNoaEmail(body: object, options?: V1ApiOptions): Promise<any> {
    return this.httpClient.post(
      this.buildUrl(`${Resources.ClientBrokerAssignments}/resend-noa`),
      {
        request: { body },
        response: {
          mapper(bodyData) {
            return bodyData;
          },
        },
        timeout: options?.timeout.toMilliseconds().asNumber(),
      },
    );
  }

  @CrossCuttingConcerns({
    logging: (id: string, body: object) => {
      return {
        message: 'V1 update bank account',
        payload: {
          id,
          body,
        },
      };
    },
    error: {
      errorSupplier: (cause) => new V1ApiError('v1-update-bank-account', cause),
    },
    observability: {
      tag: ['v1-api', 'update-bank-account'],
    },
  })
  updateBankAccount(
    id: string,
    body: object,
    options?: V1ApiOptions,
  ): Promise<any> {
    return this.httpClient.put(
      this.buildUrl(Resources.ClientBankAccounts, id),
      {
        request: {
          body: body,
        },
        response: {},
        timeout: options?.timeout.toMilliseconds().asNumber(),
      },
    );
  }
}
