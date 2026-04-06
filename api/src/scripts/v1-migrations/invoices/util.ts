import { InvoiceStatus } from '@module-persistence';

export const mapStatus = (source: object | string): InvoiceStatus => {
  const status = (
    typeof source === 'object' ? (source as any).status : source
  ) as string;

  switch (status) {
    case 'approved':
    case 'paid':
      return InvoiceStatus.Purchased;
    case 'declined':
      return InvoiceStatus.Rejected;
    case 'pending':
    default:
      return InvoiceStatus.UnderReview;
  }
};
