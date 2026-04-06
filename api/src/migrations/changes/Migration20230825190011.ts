import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGenerator } from '../utils';
import { TagDefinitionKey } from '@module-persistence/entities';

export class Migration20230825190011 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const updateQuery = tagsQueryGenerator.updateTag(
      'BROKER_VERIFICATION_REQUIRED',
      {
        key: 'VERIFICATION_ENGINE' as TagDefinitionKey,
        note: 'Needs verification',
        name: 'Needs verification',
      },
    );
    this.addSql(updateQuery);
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const updateQuery = tagsQueryGenerator.updateTag('VERIFICATION_ENGINE', {
      key: 'BROKER_VERIFICATION_REQUIRED' as TagDefinitionKey,
      note: 'Broker verification required',
      name: 'Broker verification required',
    });
    this.addSql(updateQuery);
  }
}
