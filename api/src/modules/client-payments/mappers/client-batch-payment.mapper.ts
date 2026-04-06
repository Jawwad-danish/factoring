import { DataMapperUtil } from '@common';
import { DataMapper } from '@core/mapping';
import { ClientBatchPayment } from '@fs-bobtail/factoring/data';
import { UserMapper } from '@module-common';
import { UserRepository } from '@module-persistence';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { ClientPaymentMapper } from './client-payment.mapper';

@Injectable()
export class ClientBatchPaymentMapper
  implements DataMapper<ClientBatchPaymentEntity, ClientBatchPayment>
{
  constructor(
    private readonly clientPaymentMapper: ClientPaymentMapper,
    private readonly userMapper: UserMapper,
    private readonly userRepository: UserRepository,
  ) {}

  async entityToModel(
    entity: ClientBatchPaymentEntity,
  ): Promise<ClientBatchPayment> {
    const clientBatchPayment = new ClientBatchPayment();
    clientBatchPayment.id = entity.id;
    clientBatchPayment.name = entity.name;
    clientBatchPayment.type = entity.type;
    clientBatchPayment.status = entity.status;
    clientBatchPayment.createdAt = entity.createdAt;
    clientBatchPayment.updatedAt = entity.updatedAt;
    clientBatchPayment.expectedPaymentDate = entity.expectedPaymentDate;
    clientBatchPayment.createdBy = await this.userMapper.createdByToModel(
      entity,
    );
    clientBatchPayment.updatedBy = await this.userMapper.updatedByToModel(
      entity,
    );
    clientBatchPayment.clientPayments =
      await DataMapperUtil.asyncMapCollections(
        entity.clientPayments,
        this.clientPaymentMapper,
      );
    return clientBatchPayment;
  }

  async mapS3DataToClientBatchPaymentEntity(
    data: Record<string, any>,
  ): Promise<ClientBatchPaymentEntity> {
    const entity = new ClientBatchPaymentEntity();
    const userEntity = await this.userRepository.getOneById(data.updated_by);
    entity.id = data.id;
    entity.type = data.transfer_type;
    entity.name = data.display_id;
    entity.expectedPaymentDate = data.expected_payment_date;
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    entity.status = this.mapBatchPaymentStatus(data.status);
    return entity;
  }

  private mapBatchPaymentStatus(status: string) {
    switch (status) {
      case 'sent':
      case 'accepted':
        return ClientBatchPaymentStatus.Done;
      case 'declined1':
      case 'declined2':
      case 'declined3':
      case 'declined4':
      case 'declined5':
        return ClientBatchPaymentStatus.Failed;
      default:
        return ClientBatchPaymentStatus.Pending;
    }
  }
}
