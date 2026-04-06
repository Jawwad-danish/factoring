import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big, { BigSource } from 'big.js';
import {
  DuplicateDetectionInput,
  DuplicateDetectionResult,
  DuplicateDetectionRule,
} from './duplicate-detection.rule';

interface WeightSimilarityLimit {
  lower: Big;
  upper: Big;
  weight: number;
}

class WeightSimilarityLimits {
  private static INSTANCE = new WeightSimilarityLimits();

  private items: WeightSimilarityLimit[] = [];

  private constructor() {
    this.add(0.9, 1, 4).add(0.8, 0.9, 3).add(0.7, 0.8, 2).add(0.5, 0.7, 1);
  }

  private add(lower: BigSource, upper: BigSource, weight: number) {
    this.items.push({
      lower: new Big(lower),
      upper: new Big(upper),
      weight,
    });
    return this;
  }

  private getWeightBySimilarity(value: Big): number {
    const found = this.items.find(
      (item) => value.gte(item.lower) && value.lte(item.upper),
    );
    return found?.weight || 0;
  }

  static getBySimilarity(similarity: Big): number {
    return WeightSimilarityLimits.INSTANCE.getWeightBySimilarity(similarity);
  }
}

const SIMILARITY_LIMIT = new Big(0.5);

@Injectable()
export class LoadNumberSimilarityRule implements DuplicateDetectionRule {
  constructor(private invoiceRepository: InvoiceRepository) {}

  name(): string {
    return 'load-number-similarity-rule';
  }

  async run(input: DuplicateDetectionInput): Promise<DuplicateDetectionResult> {
    const { id, loadNumber, clientId, brokerId } = input.invoice;
    const similarInvoices =
      await this.invoiceRepository.findSimilarByLoadNumber({
        id: id,
        loadNumber: loadNumber,
        clientId: clientId,
        similarityThreshold: SIMILARITY_LIMIT,
        brokerId: brokerId,
      });
    const result = new DuplicateDetectionResult();
    similarInvoices.forEach((item) => {
      const weight = WeightSimilarityLimits.getBySimilarity(item.similarity);
      result.put(weight, item.invoice);
    });
    return result;
  }
}
