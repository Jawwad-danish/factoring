import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BasicEntity } from './basic.entity';
import { FactoringClientBankAccountEntity } from './factoring-client-bank-account.entity';
import { TagDefinitionEntity } from './tag-definition.entity';

@Entity({ tableName: 'factoring_client_bank_accounts_tag_assoc' })
export class FactoringClientBankAccountAssocEntity extends BasicEntity {
  @ManyToOne({
    entity: () => TagDefinitionEntity,
  })
  tagDefinition: TagDefinitionEntity;

  @Index()
  @ManyToOne({
    entity: () => FactoringClientBankAccountEntity,
    lazy: true,
  })
  factoringClientBankAccount: FactoringClientBankAccountEntity;

  @Property({ type: 'varchar', nullable: false })
  payloadFormat: string;
}
