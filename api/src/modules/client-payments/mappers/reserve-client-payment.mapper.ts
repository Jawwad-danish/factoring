import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { ReserveClientPaymentEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { ReserveClientPayment } from '@fs-bobtail/factoring/data';
import { InvoiceMapper } from '@module-invoices';
import { ReserveMapper } from '@module-reserves/data';

@Injectable()
export class ReserveClientPaymentMapper
  implements DataMapper<ReserveClientPaymentEntity, ReserveClientPayment>
{
  constructor(
    private readonly userMapper: UserMapper,
    private readonly invoiceMapper: InvoiceMapper,
    private readonly reserveMapper: ReserveMapper,
  ) {}

  async entityToModel(
    entity: ReserveClientPaymentEntity,
  ): Promise<ReserveClientPayment> {
    const reserveClientPayment = new ReserveClientPayment();
    reserveClientPayment.id = entity.id;
    reserveClientPayment.createdAt = entity.createdAt;
    reserveClientPayment.updatedAt = entity.updatedAt;
    reserveClientPayment.createdBy = await this.userMapper.createdByToModel(
      entity,
    );
    reserveClientPayment.updatedBy = await this.userMapper.updatedByToModel(
      entity,
    );
    reserveClientPayment.amount = entity.amount;
    if (entity.reserve?.reserveInvoice?.invoice)
      reserveClientPayment.invoice = await this.invoiceMapper.entityToModel(
        entity.reserve.reserveInvoice?.invoice,
      );

    if (entity.reserve)
      reserveClientPayment.reserve = await this.reserveMapper.entityToModel(
        entity.reserve,
      );
    return reserveClientPayment;
  }
}
