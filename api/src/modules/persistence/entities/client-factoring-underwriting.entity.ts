import { Entity, Enum, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { ClientFactoringConfigsEntity } from './client-factoring-config.entity';

export enum ClientFactoringUnderwritingSubject {
  CorporationDocuments = 'corporation_documents',
  Ucc = 'ucc',
  License = 'license',
  Form8821 = '8821',
  Other = 'other',
}

@Entity({ tableName: 'client_factoring_underwriting_notes' })
export class ClientFactoringUnderwritingNotesEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    entity: () => ClientFactoringConfigsEntity,
  })
  config: Rel<ClientFactoringConfigsEntity>;

  @Property({
    type: 'text',
    nullable: false,
  })
  notes: string;

  @Enum({
    items: () => ClientFactoringUnderwritingSubject,
    nullable: false,
    default: ClientFactoringUnderwritingSubject.Other,
  })
  subject = ClientFactoringUnderwritingSubject.Other;
}
