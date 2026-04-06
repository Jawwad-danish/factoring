import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  ActivityLogEntity,
  InvoiceEntity,
  InvoiceTagEntity,
  TagDefinitionEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import { Test } from '@nestjs/testing';
import { invoiceContainsActiveTag } from './util';

describe('InvoicesTagActivity util', () => {
  const mockInvoiceWithTag = (tag: TagDefinitionEntity): InvoiceEntity => {
    const invoice = EntityStubs.buildStubInvoice();
    const invoiceTag = new InvoiceTagEntity();
    const activity = new ActivityLogEntity();
    invoiceTag.tagDefinition = tag;
    activity.tagDefinition = tag;
    invoice.tags.add(invoiceTag);
    invoice.activities.add(activity);
    return invoice;
  };

  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Checking for a tag in an invoice should be true if the invoice has that tag', () => {
    const tag = EntityStubs.buildStubTagDefinition({
      key: TagDefinitionKey.BROKER_NOT_FOUND,
    });
    const invoice = mockInvoiceWithTag(tag);
    const result = invoiceContainsActiveTag(invoice, tag);

    expect(result).toBe(true);
  });

  it('Checking for a tag in an invoice should be false if the invoice does not have the tag', () => {
    const invoice = mockInvoiceWithTag(
      EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
      }),
    );
    const result = invoiceContainsActiveTag(
      invoice,
      EntityStubs.buildStubTagDefinition({
        key: TagDefinitionKey.BROKER_CANCELLED_LOAD,
      }),
    );

    expect(result).toBe(false);
  });
});
