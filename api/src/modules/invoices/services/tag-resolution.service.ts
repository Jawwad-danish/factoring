import { ChangeActions } from '@common';
import {
  InvoiceEntity,
  RecordStatus,
  TagDefinitionGroupKey,
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionRepository,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';

const NON_RESOLVABLE_TAG_GROUPS = [
  TagDefinitionGroupKey.INTERNAL_INVOICE_ISSUES,
];

const RESOLVABLE_LEVELS = [
  TagDefinitionLevel.Warning,
  TagDefinitionLevel.Error,
];

export interface TagResolutionOptions {
  ignoreTags?: TagDefinitionKey[];
}

@Injectable()
export class TagResolutionService {
  private readonly logger = new Logger(TagResolutionService.name);

  constructor(
    private readonly tagDefinitionRepository: TagDefinitionRepository,
  ) {}

  async run(
    invoice: InvoiceEntity,
    options?: TagResolutionOptions,
  ): Promise<ChangeActions> {
    if (invoice.tags.isEmpty()) {
      return ChangeActions.empty();
    }

    const nonResolvableTagKeys: TagDefinitionKey[] = [];

    for (const group of NON_RESOLVABLE_TAG_GROUPS) {
      const groupTags = await this.tagDefinitionRepository.findByGroup(group);
      nonResolvableTagKeys.push(...groupTags.map((tag) => tag.key));
    }

    const tagsToResolve = invoice.tags
      .getItems()
      .filter((tag) => tag.recordStatus === RecordStatus.Active)
      .filter(
        (tag) =>
          !nonResolvableTagKeys.includes(tag.tagDefinition.key) &&
          RESOLVABLE_LEVELS.includes(tag.tagDefinition.level) &&
          !options?.ignoreTags?.includes(tag.tagDefinition.key),
      );

    const actions = ChangeActions.empty();
    for (const tag of tagsToResolve) {
      actions.concat(
        ChangeActions.deleteTag(tag.tagDefinition.key, {
          trackDeletion: false,
        }),
      );
    }

    this.logger.log(
      `Auto-resolved tags: ${tagsToResolve.map(
        (tag) => tag.tagDefinition.key,
      )}`,
    );

    return actions;
  }
}
