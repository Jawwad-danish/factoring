import { ValidationService } from '@core/validation';
import {
  InvoiceEntity,
  TagDefinitionEntity,
  TagDefinitionGroupKey,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { InvoiceStatusTagAssignmentValidator } from './validators';

@Injectable()
export class InvoiceTagAssignmentValidationService extends ValidationService<
  [InvoiceEntity, TagDefinitionEntity]
> {
  constructor(
    private readonly invoiceStatusTagAssignmentValidator: InvoiceStatusTagAssignmentValidator,
  ) {
    super([invoiceStatusTagAssignmentValidator]);
  }

  async anyTagIsPartOfAnyGroup(
    tags: TagDefinitionEntity[],
    keys: TagDefinitionGroupKey[],
  ): Promise<boolean> {
    return this.invoiceStatusTagAssignmentValidator.anyTagIsPartOfAnyGroup(
      tags,
      keys,
    );
  }
}
