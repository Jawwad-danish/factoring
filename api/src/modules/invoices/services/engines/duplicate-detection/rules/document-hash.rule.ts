import {
  DetectionInvoiceDocumentType,
  InvoiceDocumentLabel,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import {
  DuplicateDetectionInput,
  DuplicateDetectionResult,
  DuplicateDetectionRule,
} from './duplicate-detection.rule';

class DocumentWeightCalculator {
  private weights = new Map<InvoiceDocumentLabel, number>([
    [InvoiceDocumentLabel.Rate_of_confirmation, 3],
    [InvoiceDocumentLabel.Bill_of_landing, 2],
  ]);

  constructor(private readonly hashes: string[]) {}

  getWeight(invoice: DetectionInvoiceDocumentType): number {
    for (const [label, weight] of this.weights) {
      const document = invoice.documents.find(
        (document) => document.label === label,
      );
      if (document && this.hashes.includes(document.fileHash)) {
        return weight;
      }
    }
    return 0;
  }
}

@Injectable()
export class DocumentHashRule implements DuplicateDetectionRule {
  constructor(private invoiceRepository: InvoiceRepository) {}

  name(): string {
    return 'document-hash-rule';
  }

  async run(input: DuplicateDetectionInput): Promise<DuplicateDetectionResult> {
    const { invoice } = input;
    const hashes = invoice.documents
      .getItems()
      .map((doc) => doc.fileHash)
      .filter((hash) => hash != null);
    const calculator = new DocumentWeightCalculator(hashes as string[]);
    const invoices =
      hashes.length > 0
        ? await this.invoiceRepository.findAllByHash(
            hashes as string[],
            dayjs().subtract(3, 'months').toDate(),
            invoice,
          )
        : [];
    const result = new DuplicateDetectionResult();
    for (const invoice of invoices) {
      const weight = calculator.getWeight(
        invoice as DetectionInvoiceDocumentType,
      );
      if (weight > 0) {
        result.put(weight, invoice);
      }
    }
    return result;
  }
}
