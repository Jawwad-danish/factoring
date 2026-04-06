import { DataMapperUtil } from '@common';
import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { ClientPaymentEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { ClientPayment } from '@fs-bobtail/factoring/data';
import { InvoiceClientPaymentMapper } from './invoice-client-payment.mapper';
import { ReserveClientPaymentMapper } from './reserve-client-payment.mapper';

@Injectable()
export class ClientPaymentMapper
  implements DataMapper<ClientPaymentEntity, ClientPayment>
{
  constructor(
    private readonly userMapper: UserMapper,
    private readonly invoiceClientPaymentMapper: InvoiceClientPaymentMapper,
    private readonly reserveClientPaymentMapper: ReserveClientPaymentMapper,
  ) {}

  async entityToModel(entity: ClientPaymentEntity): Promise<ClientPayment> {
    const clientPayment = new ClientPayment();
    clientPayment.id = entity.id;
    clientPayment.batchPaymentId = entity.batchPayment.id;
    clientPayment.clientId = entity.clientId;
    clientPayment.paymentStatus = entity.status;
    clientPayment.recordStatus = entity.recordStatus;
    clientPayment.tranferType = entity.transferType;
    clientPayment.transferFee = entity.transferFee;
    clientPayment.clientPaymentType = entity.type;
    clientPayment.createdAt = entity.createdAt;
    clientPayment.updatedAt = entity.updatedAt;
    clientPayment.createdBy = await this.userMapper.createdByToModel(entity);
    clientPayment.updatedBy = await this.userMapper.updatedByToModel(entity);
    clientPayment.amount = entity.amount;
    clientPayment.lastFourDigits = entity.bankAccountLastDigits;
    if (entity.invoicePayments?.isInitialized()) {
      clientPayment.invoicePayments = await DataMapperUtil.asyncMapCollections(
        entity.invoicePayments,
        this.invoiceClientPaymentMapper,
      );
    }
    if (entity.reservePayments?.isInitialized()) {
      clientPayment.reservePayments = await DataMapperUtil.asyncMapCollections(
        entity.reservePayments,
        this.reserveClientPaymentMapper,
      );
    }
    return clientPayment;
  }
}
