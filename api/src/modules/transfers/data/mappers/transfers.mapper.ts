import { DataMapperUtil } from '@common';
import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { ClientBatchPaymentEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { ClientPaymentMapper } from '../../../client-payments';
import { CompleteTransfer } from '../complete-transfer.response';

@Injectable()
export class TransfersMapper
  implements DataMapper<ClientBatchPaymentEntity, CompleteTransfer>
{
  constructor(
    private readonly userMapper: UserMapper,
    private readonly clientPaymentMapper: ClientPaymentMapper,
  ) {}

  async entityToModel(
    entity: ClientBatchPaymentEntity,
  ): Promise<CompleteTransfer> {
    const amount = entity.clientPayments.reduce((acc, payment) => {
      return acc.add(payment.amount);
    }, new Big(0));

    return new CompleteTransfer({
      id: entity.id,
      type: entity.type,
      status: entity.status,
      sentDate: entity.createdAt,
      arrivalDate: entity.expectedPaymentDate,
      amount: amount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      updatedBy: await this.userMapper.updatedByToModel(entity),
      clientPayments: await DataMapperUtil.asyncMapCollections(
        entity.clientPayments,
        this.clientPaymentMapper,
      ),
    });
  }
}
