import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { BrokerPaymentEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { BrokerPayment } from '../broker-payment.model';
import { CreateBrokerPaymentRequest } from '../web';

@Injectable()
export class BrokerPaymentMapper
  implements DataMapper<BrokerPaymentEntity, BrokerPayment>
{
  constructor(private readonly userMapper: UserMapper) {}

  requestToEntity(
    brokerPaymentRequest: CreateBrokerPaymentRequest,
  ): BrokerPaymentEntity {
    const brokerPaymentEntity = new BrokerPaymentEntity();
    if (brokerPaymentRequest.id) {
      brokerPaymentEntity.id = brokerPaymentRequest.id;
    }
    brokerPaymentEntity.amount = brokerPaymentRequest.amount;
    brokerPaymentEntity.batchDate = brokerPaymentRequest.batchDate;
    brokerPaymentEntity.checkNumber = brokerPaymentRequest.checkNumber ?? null;
    brokerPaymentEntity.type = brokerPaymentRequest.type || null;
    return brokerPaymentEntity;
  }

  async entityToModel(entity: BrokerPaymentEntity): Promise<BrokerPayment> {
    const brokerPayment = new BrokerPayment();
    brokerPayment.id = entity.id;
    brokerPayment.invoiceId = entity.invoice.id;
    brokerPayment.type = entity.type;
    brokerPayment.checkNumber = entity.checkNumber;
    brokerPayment.amount = entity.amount;
    brokerPayment.recordStatus = entity.recordStatus;
    brokerPayment.batchDate = entity.batchDate;
    brokerPayment.createdAt = entity.createdAt;
    brokerPayment.updatedAt = entity.updatedAt;
    brokerPayment.createdBy = await this.userMapper.createdByToModel(entity);
    brokerPayment.updatedBy = await this.userMapper.updatedByToModel(entity);
    return brokerPayment;
  }
}
