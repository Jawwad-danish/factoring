import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGenerator } from '../utils';
import {
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';

const fraudulentDocumentsTag = {
  name: 'Fraudulent Documents',
  key: 'FRAUDULENT_DOCUMENTS' as TagDefinitionKey,
  usedBy: [UsedByType.System],
  visibility: TagDefinitionVisibility.All,
  level: TagDefinitionLevel.Error,
  note: 'Fraudulent Documents',
};
export class Migration20231011112842 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    this.addSql(tagsQueryGenerator.addTag(fraudulentDocumentsTag));

    this.addSql(
      tagsQueryGenerator.addTagToExistingGroup(
        'NON_PAYMENT_REASONS',
        fraudulentDocumentsTag.key,
      ),
    );

    this.addSql(
      tagsQueryGenerator.addTagToExistingGroup(
        'NON_PAYMENT_REASONS',
        'FILED_ON_BROKER_BOND',
      ),
    );
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);

    this.addSql(
      tagsQueryGenerator.removeTagFromExistingGroup(
        'NON_PAYMENT_REASONS',
        'FILED_ON_BROKER_BOND',
      ),
    );

    this.addSql(
      tagsQueryGenerator.removeTagFromExistingGroup(
        'NON_PAYMENT_REASONS',
        fraudulentDocumentsTag.key,
      ),
    );

    this.addSql(tagsQueryGenerator.removeTag(fraudulentDocumentsTag.key));
  }
}
