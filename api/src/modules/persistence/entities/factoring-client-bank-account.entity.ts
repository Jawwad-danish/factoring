import { Entity, Index, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'factoring_client_bank_accounts' })
export class FactoringClientBankAccountEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientBankAccountId: string;

  @Property({
    type: 'boolean',
    default: false,
  })
  primary = false;
}
