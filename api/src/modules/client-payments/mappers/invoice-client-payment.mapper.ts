import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { InvoiceClientPaymentEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { InvoiceClientPayment } from '@fs-bobtail/factoring/data';
import { InvoiceMapper } from '@module-invoices';

@Injectable()
export class InvoiceClientPaymentMapper
  implements DataMapper<InvoiceClientPaymentEntity, InvoiceClientPayment>
{
  constructor(
    private readonly userMapper: UserMapper,
    private readonly invoiceMapper: InvoiceMapper,
  ) {}

  async entityToModel(
    entity: InvoiceClientPaymentEntity,
  ): Promise<InvoiceClientPayment> {
    const invoiceClientPayment = new InvoiceClientPayment();
    invoiceClientPayment.id = entity.id;
    invoiceClientPayment.createdAt = entity.createdAt;
    invoiceClientPayment.updatedAt = entity.updatedAt;
    invoiceClientPayment.createdBy = await this.userMapper.createdByToModel(
      entity,
    );
    invoiceClientPayment.updatedBy = await this.userMapper.updatedByToModel(
      entity,
    );
    invoiceClientPayment.amount = entity.amount;
    invoiceClientPayment.invoice = await this.invoiceMapper.entityToModel(
      entity.invoice,
    );
    return invoiceClientPayment;
  }
}
