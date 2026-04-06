import { ClassifyInput } from './peruse';

export interface InvoiceClassificationJob {
  invoiceId: string;
  documentClassifications: DocumentClassificationJob[];
}

export interface DocumentClassificationJob {
  peruseJobId: string;
  peruseJobType: string;
  documentId: string;
  payload: ClassifyInput;
}
