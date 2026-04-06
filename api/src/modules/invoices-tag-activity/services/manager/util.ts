import {
  InvoiceEntity,
  InvoiceTagEntity,
  RecordStatus,
  TagDefinitionEntity,
} from '@module-persistence/entities';

export const invoiceContainsActiveTag = (
  invoice: InvoiceEntity,
  tag: TagDefinitionEntity,
): boolean => {
  const foundTag = findActiveInvoiceTag(invoice, tag);
  return !!foundTag;
};

export const findActiveInvoiceTag = (
  invoice: InvoiceEntity,
  tag: TagDefinitionEntity,
): undefined | InvoiceTagEntity => {
  return invoice.tags.find((invoiceTag) => {
    return (
      invoiceTag.recordStatus === RecordStatus.Active &&
      invoiceTag.tagDefinition.id === tag.id
    );
  });
};
