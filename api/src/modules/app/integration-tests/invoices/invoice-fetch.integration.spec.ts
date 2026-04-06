import {
  FilterCriteria,
  FilterOperator,
  PageCriteria,
  SortCriteria,
  SortingOrder,
} from '@core/data';
import { ContactType, Invoice } from '@module-invoices/data';
import {
  BrokerPaymentStatus,
  InvoiceStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Invoice fetching tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let brokerId: string;
  let clientId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    brokerId = appManager.broker.id;
    clientId = appManager.client.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create Invoice - Fetch invoice', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });
    const fetchedInvoice = await steps.invoice.getOne(createdInvoice.id);

    expect(fetchedInvoice.loadNumber).toBe(createdInvoice.loadNumber);
  }, 60000);

  it('Create Invoices - Fetch sorted invoices - Invoices are sorted properly by value', async () => {
    await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(1000),
    });
    await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(2000),
    });
    const fetchedInvoices = await steps.invoice.getAll({
      sort: [
        new SortCriteria({
          name: 'value',
          order: SortingOrder.DESC,
        }),
      ],
    });

    for (let i = 0; i < fetchedInvoices.length - 1; i++) {
      expect(fetchedInvoices[i].value.lt(fetchedInvoices[i + 1].value));
    }
  }, 60000);

  it('Create Invoices - Fetch sorted invoices - Invoices are sorted properly by time', async () => {
    await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(1000),
    });
    await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(2000),
    });
    const fetchedInvoices = await steps.invoice.getAll({
      sort: [
        new SortCriteria({
          name: 'createdAt',
          order: SortingOrder.DESC,
        }),
      ],
    });

    for (let i = 0; i < fetchedInvoices.length - 1; i++) {
      expect(
        new Date(fetchedInvoices[i].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(fetchedInvoices[i + 1].createdAt).getTime(),
      );
    }
  }, 60000);

  it('Create Invoices - Fetch sorted invoices - Invoices are sorted properly by hasIssues', async () => {
    const unflaggedInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(1000),
    });
    const flaggedInvoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(2000),
    });

    await steps.invoice.assignTag(flaggedInvoice.id, {
      key: TagDefinitionKey.OTHER_INVOICE_ISSUE,
    });
    const fetchedInvoicesDesc = await steps.invoice.getAll({
      sort: [
        new SortCriteria({
          name: 'hasIssues',
          order: SortingOrder.DESC,
        }),
      ],
    });

    const indexOfInvoiceWithIssues = (list: Invoice[]) =>
      list.findIndex((invoice) => invoice.id === flaggedInvoice.id);

    const indexOfNormalInvoice = (list: Invoice[]) =>
      list.findIndex((invoice) => invoice.id === unflaggedInvoice.id);

    expect(indexOfInvoiceWithIssues(fetchedInvoicesDesc)).toBeLessThan(
      indexOfNormalInvoice(fetchedInvoicesDesc),
    );

    let page = 1;
    let foundBothInvoices = false;
    let lastFetchedInvoices: Invoice[] = [];

    while (!foundBothInvoices && page <= 10) {
      lastFetchedInvoices = await steps.invoice.getAll({
        sort: [
          new SortCriteria({
            name: 'hasIssues',
            order: SortingOrder.ASC,
          }),
        ],
        page: new PageCriteria({
          page,
          limit: 25,
        }),
      });

      if (
        lastFetchedInvoices.some((i) => i.id === flaggedInvoice.id) &&
        lastFetchedInvoices.some((i) => i.id === unflaggedInvoice.id)
      ) {
        foundBothInvoices = true;
      } else {
        page++;
      }
    }

    expect(
      indexOfInvoiceWithIssues(lastFetchedInvoices),
    ).toBeGreaterThanOrEqual(indexOfNormalInvoice(lastFetchedInvoices));
  }, 60000);

  it('Create Invoices - Fetch filter invoices by broker tag - Returned invoices are of brokers with specified tag', async () => {
    await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(1000),
    });

    const fetchedInvoicesWithBrokerTag = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'brokerTag',
          operator: FilterOperator.EQ,
          value: TagDefinitionKey.INVOICE_EMAIL_BLOCKED,
        }),
      ],
    });

    expect(fetchedInvoicesWithBrokerTag.length).toBeGreaterThanOrEqual(1);

    const fetchedInvoicesWithoutBrokerTag = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'brokerTag',
          operator: FilterOperator.EQ,
          value: TagDefinitionKey.BROKER_REQUIRE_FAX,
        }),
      ],
    });

    expect(fetchedInvoicesWithoutBrokerTag.length).toBe(0);
  }, 60000);

  it('Create Invoices - Fetch filter invoices with predefined flagged tag - Returned invoices with the flagged filter payload', async () => {
    const invoice = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: Big(1000),
    });
    await steps.invoice.verify(invoice.id, {
      contactPerson: 'integration',
      contactType: ContactType.Phone,
      notes: 'test',
      status: VerificationStatus.Verified,
    });
    await steps.invoice.purchase(invoice.id);
    await steps.invoice.assignTag(invoice.id, {
      key: TagDefinitionKey.BROKER_SENT_PAYMENT_VIA_E_CHECK,
    });
    const fetchedInvoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'status',
          operator: FilterOperator.EQ,
          value: InvoiceStatus.Purchased,
        }),
        new FilterCriteria({
          name: 'tagGroups',
          operator: FilterOperator.IN,
          value: [
            'INVOICE_ISSUES',
            'REJECTION_REASONS',
            'BROKER_CONFIGURATION',
            'PROCESSING_ACTION_ITEMS',
            'ISSUES_SENDING_INVOICE_TO_BROKER',
          ],
        }),
        new FilterCriteria({
          name: 'brokerPaymentStatus',
          operator: FilterOperator.NIN,
          value: ['shortpaid', 'overpaid', 'nonpayment', 'in_full'],
        }),
      ],
    });

    let valid = true;
    fetchedInvoices.forEach((invoiceEntry) => {
      if (invoiceEntry.tags.length === 0) {
        valid = false;
      }
    });
    expect(valid).toBeTruthy();
  }, 60000);

  it('Create Invoice - Pay In Full - Fetch Paid In Full Invoices ', async () => {
    const { id } = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.verify(id);
    await steps.invoice.purchase(id);
    await steps.invoice.sendPayment(id);
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(1000),
    });

    const fetchedInvoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'status',
          operator: FilterOperator.EQ,
          value: InvoiceStatus.Purchased,
        }),
        new FilterCriteria({
          name: 'brokerPaymentStatus',
          operator: FilterOperator.EQ,
          value: BrokerPaymentStatus.InFull,
        }),
      ],
    });
    const invoiceIsRetrieved = fetchedInvoices.find(
      (invoice) => invoice.id === id,
    );
    expect(fetchedInvoices.length).toBeGreaterThanOrEqual(1);
    expect(invoiceIsRetrieved).toBeDefined();
  }, 60000);

  it('Create Invoice - Pay Nonpayment - Fetch Paid Nonpayment Invoices ', async () => {
    const { id } = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.verify(id);
    await steps.invoice.purchase(id);
    await steps.invoice.sendPayment(id);
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(0),
    });

    const fetchedInvoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'status',
          operator: FilterOperator.EQ,
          value: InvoiceStatus.Purchased,
        }),
        new FilterCriteria({
          name: 'brokerPaymentStatus',
          operator: FilterOperator.EQ,
          value: BrokerPaymentStatus.NonPayment,
        }),
      ],
    });
    const invoiceIsRetrieved = fetchedInvoices.find(
      (invoice) => invoice.id === id,
    );
    expect(fetchedInvoices.length).toBeGreaterThanOrEqual(1);
    expect(invoiceIsRetrieved).toBeDefined();
  }, 60000);

  it('Create Invoice - Pay Shortpaid - Fetch Paid Shortpaid Invoices ', async () => {
    const { id } = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.verify(id);
    await steps.invoice.purchase(id);
    await steps.invoice.sendPayment(id);
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(500),
    });

    const fetchedInvoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'status',
          operator: FilterOperator.EQ,
          value: InvoiceStatus.Purchased,
        }),
        new FilterCriteria({
          name: 'brokerPaymentStatus',
          operator: FilterOperator.EQ,
          value: BrokerPaymentStatus.ShortPaid,
        }),
      ],
    });
    const invoiceIsRetrieved = fetchedInvoices.find(
      (invoice) => invoice.id === id,
    );
    expect(fetchedInvoices.length).toBeGreaterThanOrEqual(1);
    expect(invoiceIsRetrieved).toBeDefined();
  }, 60000);

  it('Create Invoice - Pay Overpaid - Fetch Paid Overpaid Invoices ', async () => {
    const { id } = await steps.invoice.create({
      clientId,
      brokerId,
      lineHaulRate: new Big(1000),
      lumper: new Big(0),
      detention: new Big(0),
      advance: new Big(0),
    });
    await steps.invoice.verify(id);
    await steps.invoice.purchase(id);
    await steps.invoice.sendPayment(id);
    await steps.brokerPayment.create({
      invoiceId: id,
      amount: new Big(10000),
    });

    const fetchedInvoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'status',
          operator: FilterOperator.EQ,
          value: InvoiceStatus.Purchased,
        }),
        new FilterCriteria({
          name: 'brokerPaymentStatus',
          operator: FilterOperator.EQ,
          value: BrokerPaymentStatus.Overpaid,
        }),
      ],
    });
    const invoiceIsRetrieved = fetchedInvoices.find(
      (invoice) => invoice.id === id,
    );
    expect(fetchedInvoices.length).toBeGreaterThanOrEqual(1);
    expect(invoiceIsRetrieved).toBeDefined();
  }, 60000);

  it('Create Invoice - Fetch by load number - Exact result', async () => {
    const createdInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });

    const invoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'loadNumber',
          operator: FilterOperator.EQ,
          value: createdInvoice.loadNumber,
        }),
      ],
    });
    expect(invoices.length).toBe(1);
  }, 60000);

  it('Create Invoices - Tag one of them - filter by isDirty', async () => {
    const cleanInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });

    const dirtyInvoice = await steps.invoice.create({
      clientId,
      brokerId,
    });

    await steps.invoice.assignTag(dirtyInvoice.id, {
      key: TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION,
    });

    const invoices = await steps.invoice.getAll({
      filters: [
        new FilterCriteria({
          name: 'isDirty',
          operator: FilterOperator.EQ,
          value: 'true',
        }),
      ],
    });
    const isDirtyInvoiceInResult = invoices.some(
      (invoice) => invoice.loadNumber === dirtyInvoice.loadNumber,
    );
    expect(isDirtyInvoiceInResult).toBeTruthy();

    const isCleanInvoiceInResult = invoices.some(
      (invoice) => invoice.loadNumber === cleanInvoice.loadNumber,
    );
    expect(isCleanInvoiceInResult).toBeFalsy();
  }, 60000);
});
