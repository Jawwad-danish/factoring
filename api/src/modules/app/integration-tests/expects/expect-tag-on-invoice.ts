import {
  ActivityLog,
  Invoice,
  TagDefinition,
} from '@fs-bobtail/factoring/data';
import { TagDefinitionKey } from '../../../persistence';

export const expectTagOnInvoice = (tag: TagDefinition, invoice: Invoice) => {
  expect(
    invoice.tags.find((invoiceTag) => invoiceTag.key === tag.key),
  ).toBeDefined();
};

export const expectTagNotOnInvoice = (tag: TagDefinition, invoice: Invoice) => {
  expect(
    invoice.tags.find((invoiceTag) => invoiceTag.key === tag.key),
  ).toBeUndefined();
};

export const expectTagKeyOnInvoice = (
  key: TagDefinitionKey,
  invoice: Invoice,
) => {
  expect(
    invoice.tags.find((invoiceTag) => invoiceTag.key === key),
  ).toBeDefined();
};

export const expectTagKeyOnInvoiceActivity = (
  key: TagDefinitionKey,
  invoice: Invoice,
): ActivityLog => {
  const activity = invoice.activities.find(
    (activity) => activity.tagDefinition.key === key,
  );
  expect(activity).toBeDefined();
  return activity!;
};

export const expectTagKeyNotOnInvoiceActivity = (
  key: TagDefinitionKey,
  invoice: Invoice,
) => {
  const activity = invoice.activities.find(
    (activity) => activity.tagDefinition.key === key,
  );
  expect(activity).toBeUndefined();
};

export const expectTagKeyOnInvoiceCount = (
  key: TagDefinitionKey,
  invoice: Invoice,
  count: number,
) => {
  const tags = invoice.tags.filter((invoiceTag) => invoiceTag.key === key);
  expect(tags.length).toBe(count);
};

export const expectTagActivityKeyOnInvoiceCount = (
  key: TagDefinitionKey,
  invoice: Invoice,
  count: number,
) => {
  const tags = invoice.activities.filter(
    (activity) => activity.tagDefinition.key === key,
  );
  expect(tags.length).toBe(count);
};

export const expectTagKeyNotOnInvoice = (
  key: TagDefinitionKey,
  invoice: Invoice,
) => {
  expect(
    invoice.tags.find((invoiceTag) => invoiceTag.key === key),
  ).toBeUndefined();
};
