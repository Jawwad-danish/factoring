import { CrossCuttingConcerns } from '@core/util';
import {
  DetectionInvoiceType,
  InvoiceEntity,
} from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentHashRule,
  DuplicateDetectionRule,
  LoadNumberSimilarityRule,
  LoadNumberSplitRule,
  MonetarySimilarityRule,
} from './rules';

export interface DuplicateDetectionItem {
  invoice: DetectionInvoiceType;
  totalWeight: number;
  weights: {
    ruleName: string;
    ruleWeight: number;
  }[];
}

class EngineInternalResult {
  private static VALID_WEIGHT_LIMIT = 2;
  private items: DuplicateDetectionItem[] = [];

  getAllWithinLimits(): DuplicateDetectionItem[] {
    return this.items.filter(
      (output) => output.totalWeight >= EngineInternalResult.VALID_WEIGHT_LIMIT,
    );
  }

  getByInvoice(invoice: DetectionInvoiceType): DuplicateDetectionItem {
    for (const item of this.items) {
      if (item.invoice.id === invoice.id) {
        return item;
      }
    }
    const item: DuplicateDetectionItem = {
      invoice,
      totalWeight: 0,
      weights: [],
    };
    this.items.push(item);
    return item;
  }
}

@Injectable()
export class DuplicateDetectionEngine {
  private readonly logger = new Logger(DuplicateDetectionEngine.name);
  private readonly rules: DuplicateDetectionRule[];

  constructor(
    readonly loadNumberSimilarity: LoadNumberSimilarityRule,
    readonly monetarySimilarityRule: MonetarySimilarityRule,
    readonly documentHashRule: DocumentHashRule,
    readonly loadNumberSplitRule: LoadNumberSplitRule,
  ) {
    this.rules = [loadNumberSplitRule];
  }

  @CrossCuttingConcerns({
    logging: (input: InvoiceEntity) => {
      return {
        message: 'Duplicate detection engine',
        payload: {
          invoice: {
            id: input.id,
            loadNumber: input.loadNumber,
          },
        },
      };
    },
  })
  async run(invoice: InvoiceEntity): Promise<DuplicateDetectionItem[]> {
    const engineResult = new EngineInternalResult();
    for (const rule of this.rules) {
      this.logger.debug('Running duplicate detection rule', {
        name: rule.name(),
        invoice: {
          id: invoice.id,
          loadNumber: invoice.loadNumber,
        },
      });

      const ruleResult = await rule.run({ invoice });
      for (const [weight, invoices] of ruleResult) {
        invoices.forEach((invoice) => {
          const item = engineResult.getByInvoice(invoice);
          item.totalWeight += weight;
          item.weights.push({
            ruleName: rule.name(),
            ruleWeight: weight,
          });
        });
      }
    }
    return engineResult.getAllWithinLimits();
  }
}
