import { Migration } from '@mikro-orm/migrations';
import {
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence';
import { TagDefinitionData } from '../utils/data/tag-data-generator-v2';
import { TagsQueryGeneratorV2 } from '../utils/queries/tags-query-generator-v2';

export class Migration20240201100630 extends Migration {
  async up(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const tagData of newRejectionReasons) {
      this.addSql(queryGenerator.addTag(tagData));
      this.addSql(
        queryGenerator.addTagToExistingGroup('REJECTION_REASONS', tagData.key),
      );
    }
  }

  async down(): Promise<void> {
    const queryGenerator = new TagsQueryGeneratorV2(this.driver);

    for (const tagData of newRejectionReasons) {
      this.addSql(
        queryGenerator.removeTagFromExistingGroup(
          'REJECTION_REASONS',
          tagData.key,
        ),
      );
      this.addSql(queryGenerator.removeTag(tagData.key));
    }
  }
}

const PODandRateCon: TagDefinitionData = {
  name: 'POD and Rate Con do not match',
  key: 'POD_AND_RATE_CON_NOT_MATCHING',
  usedBy: [UsedByType.User],
  visibility: TagDefinitionVisibility.All,
  level: TagDefinitionLevel.Error,
  note: 'POD and Rate Con do not match',
};

const VerificationUnsuccessful: TagDefinitionData = {
  name: 'Verification unsuccessful',
  key: 'VERIFICATION_UNSUCCESSFUL',
  usedBy: [UsedByType.User],
  visibility: TagDefinitionVisibility.All,
  level: TagDefinitionLevel.Error,
  note: 'Verification unsuccessful',
};

const RequestedPaperworkNotSubmitted: TagDefinitionData = {
  name: 'Requested paperwork not submitted',
  key: 'REQUESTED_PAPERWORK_NOT_SUBMITTED',
  usedBy: [UsedByType.User],
  visibility: TagDefinitionVisibility.All,
  level: TagDefinitionLevel.Error,
  note: 'Requested paperwork not submitted',
};

const newRejectionReasons = [
  PODandRateCon,
  VerificationUnsuccessful,
  RequestedPaperworkNotSubmitted,
];
