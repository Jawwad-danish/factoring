import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  DetectionInvoiceType,
  InvoiceDocumentLabel,
  InvoiceEntity,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentHashRule } from './document-hash.rule';
import { EntityStubs } from '@module-persistence/test';

describe('DocumentHashRule', () => {
  let rule: DocumentHashRule;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentHashRule, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(DocumentHashRule);
    invoiceRepository = module.get(InvoiceRepository);
  });

  const getInputInvoiceWithMocks = (
    label: InvoiceDocumentLabel,
  ): InvoiceEntity => {
    const document = EntityStubs.buildStubInvoiceDocument({
      label,
    });
    const entity = EntityStubs.buildStubInvoice();
    const data: DetectionInvoiceType & {
      documents: Record<string, string>[];
    } = {
      id: entity.id,
      loadNumber: entity.loadNumber,
      documents: [
        {
          id: document.id,
          label: document.label,
          fileHash: document.fileHash || '',
        },
      ],
    };

    jest
      .spyOn(invoiceRepository, 'findAllByHash')
      .mockResolvedValueOnce([data as DetectionInvoiceType]);

    return EntityStubs.buildStubInvoice({ documents: [document] });
  };

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('When same rate confirmation document, weight is 3', async () => {
    const inputInvoice = getInputInvoiceWithMocks(
      InvoiceDocumentLabel.Rate_of_confirmation,
    );

    const result = await rule.run({
      invoice: inputInvoice,
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(3);
      expect(invoices.length).toBe(1);
    }
  });

  it('When same bill of lading, weight is 2', async () => {
    const inputInvoice = getInputInvoiceWithMocks(
      InvoiceDocumentLabel.Bill_of_landing,
    );

    const result = await rule.run({
      invoice: inputInvoice,
    });

    expect(result.isEmpty()).toBeFalsy();
    for (const [weight, invoices] of result) {
      expect(weight).toBe(2);
      expect(invoices.length).toBe(1);
    }
  });

  it('When same document that is not rate of confirmation or bill of lading, weight is 0', async () => {
    const inputInvoice = getInputInvoiceWithMocks(
      InvoiceDocumentLabel.Lumper_receipt,
    );

    const result = await rule.run({
      invoice: inputInvoice,
    });

    expect(result.isEmpty()).toBeTruthy();
  });
});
