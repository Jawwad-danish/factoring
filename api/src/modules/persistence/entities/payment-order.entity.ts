import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import Big from 'big.js';
import { BigJsType } from './big.type';
import { BasicEntity } from './basic.entity';
import { TransferType } from './../../transfers/api/models/transfer-type';

@Entity({ tableName: 'payment_order' })
export class PaymentOrderEntity extends BasicEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({ type: BigJsType, nullable: false, default: 0 })
  amount: Big = Big(0);

  @Enum({
    items: () => TransferType,
    nullable: false,
  })
  transferType: TransferType;

  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientBankAccountId: string;

  @Property({ type: 'text', nullable: true, length: 4 })
  bankAccountLastDigits: string;
}
