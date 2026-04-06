import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import { DuplicateDetectionEngine } from '../../../../engines';
import { InvoiceRule } from './invoice-rule';

@Injectable()
export class PossibleDuplicateRule<
  P extends CreateInvoiceRequest | UpdateInvoiceRequest | RevertInvoiceRequest,
> implements InvoiceRule<P>
{
  constructor(
    private readonly duplicateDetectionEngine: DuplicateDetectionEngine,
  ) {}

  async run({ entity }: CommandInvoiceContext<P>): Promise<ChangeActions> {
    const engineResult = await this.duplicateDetectionEngine.run(entity);
    const isAlreadyTagged = await InvoiceEntityUtil.findActiveTag(
      entity,
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    );

    if (!isAlreadyTagged && !_.isEmpty(engineResult)) {
      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
            {
              placeholders: {
                loadNumber: entity.loadNumber,
                possibleDuplicates: engineResult
                  .map((result) => result.invoice.loadNumber)
                  .join(','),
              },
              data: {
                invoice: {
                  id: entity.id,
                  loadNumber: entity.loadNumber,
                },
                duplicates: engineResult.map((result) => {
                  return {
                    id: result.invoice.id,
                    loadNumber: result.invoice.loadNumber,
                    totalWeight: result.totalWeight,
                    weights: result.weights,
                  };
                }),
              },
            },
          ),
        ),
      );
    }

    if (isAlreadyTagged && _.isEmpty(engineResult)) {
      return ChangeActions.deleteTag(
        TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      );
    }
    return ChangeActions.empty();
  }
}
