import { Entity, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'quickbooks_tokens' })
export class QuickbookTokensEntity extends BasicMutableEntity {
  @Property({
    type: 'text',
    nullable: false,
    comment: 'Quickbooks API encrypted token',
  })
  encryptedToken: string;
}
