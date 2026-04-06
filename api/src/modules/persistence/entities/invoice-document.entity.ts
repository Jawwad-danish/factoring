import { Entity, Enum, Index, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { InvoiceEntity } from './invoice.entity';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum InvoiceDocumentType {
  Generated = 'generated',
  Uploaded = 'uploaded',
}

export enum InvoiceDocumentLabel {
  Rate_of_confirmation = 'rate_of_confirmation',
  Bill_of_landing = 'bill_of_landing',
  Lumper_receipt = 'lumper_receipt',
  Scale_ticket = 'scale_ticket',
  Other = 'other',
}

@Entity({ tableName: 'documents' })
export class InvoiceDocumentEntity extends BasicMutableEntity {
  @Index()
  @Property({ type: 'varchar', nullable: false })
  name: string;

  @Enum({
    items: () => InvoiceDocumentType,
    default: InvoiceDocumentType.Generated,
    nullable: false,
  })
  type: InvoiceDocumentType = InvoiceDocumentType.Generated;

  @Enum({
    items: () => InvoiceDocumentLabel,
    default: InvoiceDocumentLabel.Other,
    nullable: false,
  })
  label: InvoiceDocumentLabel = InvoiceDocumentLabel.Other;

  @Property({ type: 'text', nullable: false })
  internalUrl: string;

  @Property({ type: 'text', nullable: true })
  externalUrl: string;

  @Property({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @Property({ type: 'varchar', nullable: true })
  fileHash: null | string;

  @Index()
  @ManyToOne(() => InvoiceEntity)
  invoice: Rel<InvoiceEntity>;
}
