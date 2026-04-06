import { RecordStatus } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import {
  DuplicateDetectionInput,
  DuplicateDetectionResult,
  DuplicateDetectionRule,
} from './duplicate-detection.rule';

@Injectable()
export class LoadNumberSplitRule implements DuplicateDetectionRule {
  constructor(private invoiceRepository: InvoiceRepository) {}

  name(): string {
    return 'load-number-split';
  }

  async run({
    invoice,
  }: DuplicateDetectionInput): Promise<DuplicateDetectionResult> {
    const { clientId, brokerId, loadNumber } = invoice;
    const loadNumberChunks = this.splitLoadNumbers(loadNumber, 2);
    const similarInvoices = await this.invoiceRepository
      .queryBuilder()
      .select(['id', 'loadNumber'])
      .where({
        clientId,
        brokerId,
        recordStatus: RecordStatus.Active,
      })
      .andWhere(
        loadNumberChunks.map((chunk) => ({
          load_number: { $ilike: `%${chunk}%` },
        })),
      )
      .execute('all', true);
    const result = new DuplicateDetectionResult();
    for (const possibleDuplicate of similarInvoices) {
      if (possibleDuplicate.id === invoice.id) {
        continue;
      }
      if (
        invoice.loadNumber
          ?.toLowerCase()
          ?.includes(possibleDuplicate.loadNumber?.toLowerCase()) ||
        possibleDuplicate.loadNumber
          ?.toLowerCase()
          ?.includes(invoice.loadNumber?.toLowerCase())
      ) {
        result.put(3, {
          id: possibleDuplicate.id,
          loadNumber: possibleDuplicate.loadNumber,
        });
      }
    }
    return result;
  }

  private splitLoadNumbers(loadNumber: string, iterations: number): string[] {
    const chunks = (loadNumber.match(/.{1,3}/g) || []).filter(
      (chunk) => (chunk as string).length === 3,
    );
    if (iterations === 0) {
      return chunks;
    }
    return chunks.concat(
      this.splitLoadNumbers(loadNumber.slice(1), iterations - 1),
    );
  }
}
