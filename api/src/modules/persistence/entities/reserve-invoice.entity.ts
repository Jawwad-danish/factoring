import {
  Cascade,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  Rel,
} from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { InvoiceEntity } from './invoice.entity';
import { ReserveEntity } from './reserve.entity';

@Entity({ tableName: 'reserves_invoice' })
export class ReserveInvoiceEntity extends BasicMutableEntity {
  @Index()
  @ManyToOne({
    cascade: [Cascade.ALL],
    entity: () => InvoiceEntity,
    eager: true,
  })
  invoice: Rel<InvoiceEntity>;

  @OneToOne({
    cascade: [Cascade.ALL],
    entity: () => ReserveEntity,
    lazy: true,
  })
  reserve: Rel<ReserveEntity>;
}
