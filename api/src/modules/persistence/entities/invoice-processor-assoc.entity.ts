import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { InvoiceEntity } from './invoice.entity';
import { BasicMutableEntity } from './basic-mutable.entity';

@Entity({ tableName: 'invoice_processor_assoc' })
export class InvoiceProcessorAssocEntity extends BasicMutableEntity {
  @Property({ type: 'varchar', nullable: false })
  name: string;

  @Index()
  @ManyToOne({ entity: () => InvoiceEntity })
  invoice: InvoiceEntity;

  @Property({ type: 'uuid' })
  processorId: string; // TODO: associate this with the user/employee table when we implement one
}
