import { Migration } from '@mikro-orm/migrations';
import { TagsQueryGenerator } from '../utils';

export class Migration20230829144254 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    for (const [tagGroupKey, tagsToAdd] of Object.entries(tagsPerGroup)) {
      for (const tagKey of tagsToAdd) {
        this.addSql(
          tagsQueryGenerator.addTagToExistingGroup(tagGroupKey, tagKey),
        );
      }
    }
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    for (const [tagGroupKey, tagsToRemove] of Object.entries(tagsPerGroup)) {
      for (const tagKey of tagsToRemove) {
        this.addSql(
          tagsQueryGenerator.removeTagFromExistingGroup(tagGroupKey, tagKey),
        );
      }
    }
  }
}

const tagsPerGroup = {
  INVOICE_ISSUES: [
    'POSSIBLE_CLAIM_ON_LOAD',
    'BROKER_CLAIM_AGAINST_CLIENT',
    'LOAD_NOT_DELIVERED',
    'BROKER_PAID_PREVIOUS_FACTOR',
  ],
  NON_PAYMENT_REASONS: [
    'BROKER_CLAIM_AGAINST_CLIENT',
    'BROKER_PAID_CLIENT_DIRECTLY',
    'DUPLICATE_INVOICE',
    'LOAD_NOT_DELIVERED',
    'BROKER_PAID_PREVIOUS_FACTOR',
  ],
  REJECTION_REASONS: [
    'POSSIBLE_CLAIM_ON_LOAD',
    'BROKER_CLAIM_AGAINST_CLIENT',
    'DUPLICATE_INVOICE',
    'LOAD_NOT_DELIVERED',
  ],
  BROKER_PAYMENT_ISSUES: [
    'BROKER_CLAIM_AGAINST_CLIENT',
    'BROKER_PAID_CLIENT_DIRECTLY',
  ],
};
