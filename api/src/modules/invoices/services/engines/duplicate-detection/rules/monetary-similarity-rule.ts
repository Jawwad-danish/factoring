import { FilterQuery } from '@mikro-orm/core';
import { Field } from '@mikro-orm/postgresql';
import {
  DetectionInvoiceType,
  InvoiceEntity,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import dayjs from 'dayjs';
import {
  DuplicateDetectionInput,
  DuplicateDetectionResult,
  DuplicateDetectionRule,
} from './duplicate-detection.rule';

const MONETARY_MARGIN_OF_ERROR = new Big(100);

@Injectable()
export class MonetarySimilarityRule implements DuplicateDetectionRule {
  constructor(private invoiceRepository: InvoiceRepository) {}

  name(): string {
    return 'monetary-similarity-rule';
  }

  async run(input: DuplicateDetectionInput): Promise<DuplicateDetectionResult> {
    const { invoice } = input;
    const baseWhere: FilterQuery<InvoiceEntity> = {
      clientId: { $eq: invoice.clientId },
      brokerId: { $eq: invoice.brokerId },
    };
    if (invoice.id) {
      baseWhere.id = { $ne: invoice.id };
    }

    const where: FilterQuery<InvoiceEntity> = {
      ...baseWhere,
      lumper: {
        $gte: invoice.lumper.minus(MONETARY_MARGIN_OF_ERROR),
        $lte: invoice.lumper.plus(MONETARY_MARGIN_OF_ERROR),
      },
      detention: {
        $gte: invoice.detention.minus(MONETARY_MARGIN_OF_ERROR),
        $lte: invoice.detention.plus(MONETARY_MARGIN_OF_ERROR),
      },
      lineHaulRate: {
        $gte: invoice.lineHaulRate.minus(MONETARY_MARGIN_OF_ERROR),
        $lte: invoice.lineHaulRate.plus(MONETARY_MARGIN_OF_ERROR),
      },
      advance: {
        $gte: invoice.advance.minus(MONETARY_MARGIN_OF_ERROR),
        $lte: invoice.advance.plus(MONETARY_MARGIN_OF_ERROR),
      },
      createdAt: { $gt: dayjs().subtract(3, 'months').toDate() },
    };
    const selectFields: Field<InvoiceEntity>[] = ['id', 'load_number'];
    const invoices = await this.invoiceRepository.getExplicitInvoiceFields(
      selectFields,
      where,
    );

    return DuplicateDetectionResult.fromInvoices(
      1,
      invoices as DetectionInvoiceType[],
    );
  }
}
