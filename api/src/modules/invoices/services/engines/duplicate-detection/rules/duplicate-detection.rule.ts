import {
  DetectionInvoiceType,
  InvoiceEntity,
} from '@module-persistence/entities';

export interface DuplicateDetectionInput {
  invoice: InvoiceEntity;
}

export class DuplicateDetectionResult {
  private readonly map = new Map<number, DetectionInvoiceType[]>();

  put(weight: number, data: DetectionInvoiceType | DetectionInvoiceType[]) {
    const found = this.map.get(weight);
    const toPut = Array.isArray(data) ? data : [data];
    if (found) {
      found.push(...toPut);
    } else {
      this.map.set(weight, toPut);
    }
  }

  count(): number {
    return this.map.size;
  }

  isEmpty(): boolean {
    return this.map.size === 0;
  }

  [Symbol.iterator]() {
    return this.map.entries();
  }

  static fromInvoices(
    weight: number,
    invoices: DetectionInvoiceType[],
  ): DuplicateDetectionResult {
    const result = new DuplicateDetectionResult();
    result.put(weight, invoices);
    return result;
  }
}

export interface DuplicateDetectionRule {
  name(): string;

  run(input: DuplicateDetectionInput): Promise<DuplicateDetectionResult>;
}
