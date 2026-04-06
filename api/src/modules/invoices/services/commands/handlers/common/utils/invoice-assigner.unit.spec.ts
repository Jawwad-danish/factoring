import { mockMikroORMProvider, mockToken } from '@core/test';
import { InvoiceDocumentMapper } from '@module-invoices/data';
import {
  buildStubUpdateInvoiceAmounts,
  buildStubUpdateInvoiceDetails,
  buildStubUpdateInvoiceDocumentsAdd,
  buildStubUpdateInvoiceDocumentsLabel,
} from '@module-invoices/test';
import { TagDefinitionKey } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceAssigner } from './invoice-assigner';
import { BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { EntityStubs } from '@module-persistence/test';
import { TagResolutionService } from '../../../../tag-resolution.service';
import { ChangeActions } from '@common';

describe('Invoice assigner', () => {
  let invoiceAssigner: InvoiceAssigner;
  let brokerService: BrokerService;
  let tagResolutionService: TagResolutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        InvoiceAssigner,
        InvoiceDocumentMapper,
        BrokerService,
        TagResolutionService,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })

      .compile();

    invoiceAssigner = module.get(InvoiceAssigner);
    brokerService = module.get(BrokerService);
    tagResolutionService = module.get(TagResolutionService);
  });

  it('Should be defined', () => {
    expect(invoiceAssigner).toBeDefined();
  });

  it('Invoice has activity if amount changes are done', async () => {
    jest
      .spyOn(brokerService, 'getOneById')
      .mockResolvedValueOnce(buildStubBroker());
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(ChangeActions.empty());
    const entity = EntityStubs.buildStubInvoice();
    const updateInvoice = buildStubUpdateInvoiceAmounts();
    const result = await invoiceAssigner.apply(entity, updateInvoice);

    const foundActivity = result.actions.find(
      (action) => action.key === TagDefinitionKey.UPDATE_INVOICE,
    );

    expect(foundActivity).toBeDefined();
    expect(foundActivity?.noteDetails?.payload).toBeDefined();
  });

  it('Invoice has activity if detail changes are done', async () => {
    jest
      .spyOn(brokerService, 'getOneById')
      .mockResolvedValueOnce(buildStubBroker());
    jest
      .spyOn(brokerService, 'getOneById')
      .mockResolvedValueOnce(buildStubBroker());
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(ChangeActions.empty());
    const entity = EntityStubs.buildStubInvoice();
    const updateInvoice = buildStubUpdateInvoiceDetails();
    const result = await invoiceAssigner.apply(entity, updateInvoice);

    const foundActivity = result.actions.find(
      (action) => action.key === TagDefinitionKey.UPDATE_INVOICE,
    );

    expect(foundActivity).toBeDefined();
    expect(foundActivity?.noteDetails?.payload).toBeDefined();
  });

  it('Invoice has activity if documents are added', async () => {
    jest
      .spyOn(brokerService, 'getOneById')
      .mockResolvedValueOnce(buildStubBroker());
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(ChangeActions.empty());
    const entity = EntityStubs.buildStubInvoice();
    const updateInvoice = buildStubUpdateInvoiceDocumentsAdd();
    const result = await invoiceAssigner.apply(entity, updateInvoice);

    const foundActivity = result.actions.find(
      (action) => action.key === TagDefinitionKey.DOCUMENTS_ADD,
    );

    expect(foundActivity).toBeDefined();
    expect(foundActivity?.noteDetails?.payload).toBeDefined();
  }, 200000);

  it('Invoice has activity if documents labels are updated', async () => {
    jest
      .spyOn(brokerService, 'getOneById')
      .mockResolvedValueOnce(buildStubBroker());
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(ChangeActions.empty());
    const entity = EntityStubs.buildStubInvoice();
    const updateInvoice = buildStubUpdateInvoiceDocumentsLabel();
    const result = await invoiceAssigner.apply(entity, updateInvoice);

    const foundActivity = result.actions.find(
      (action) => action.key === TagDefinitionKey.DOCUMENTS_UPDATE,
    );

    expect(foundActivity).toBeDefined();
    expect(foundActivity?.noteDetails?.payload).toBeDefined();
  });

  it('Invoice has activity note with the removable tag names ', async () => {
    jest
      .spyOn(brokerService, 'getOneById')
      .mockResolvedValueOnce(buildStubBroker());
    jest
      .spyOn(tagResolutionService, 'run')
      .mockResolvedValueOnce(
        ChangeActions.deleteTag(TagDefinitionKey.BROKER_CANCELLED_LOAD).concat(
          ChangeActions.deleteTag(TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE),
        ),
      );
    const entity = EntityStubs.buildStubInvoice();
    const updateInvoice = buildStubUpdateInvoiceDocumentsLabel();
    const result = await invoiceAssigner.apply(entity, updateInvoice);
    const foundDocumentsUpdateActivity = result.actions.find(
      (action) => action.key === TagDefinitionKey.DOCUMENTS_UPDATE,
    );
    const foundInvoiceUpdateActivity = result.actions.find(
      (action) => action.key === TagDefinitionKey.UPDATE_INVOICE,
    );

    expect(foundDocumentsUpdateActivity).toBeDefined();
    expect(foundDocumentsUpdateActivity?.noteDetails?.payload).toBeDefined();
    expect(foundInvoiceUpdateActivity).toBeDefined();
    expect(foundInvoiceUpdateActivity?.noteDetails?.getText()).toContain(
      `tags removed: broker cancelled load, possible duplicate invoice`,
    );
  });
});
