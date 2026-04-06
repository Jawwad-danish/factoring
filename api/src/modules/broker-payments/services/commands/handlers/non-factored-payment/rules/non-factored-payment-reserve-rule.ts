import { ChangeActions } from '@common';
import { CrossCuttingConcerns } from '@core/util';
import {
  BrokerPaymentEntity,
  InvoiceEntity,
  ReserveBrokerPaymentEntity,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import {
  ReserveBrokerPaymentRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common';

@Injectable()
export class NonFactoredPaymentReserveRule
  implements BrokerPaymentRule<DeleteBrokerPaymentRequest>
{
  logger = new Logger(NonFactoredPaymentReserveRule.name);

  constructor(
    private readonly reserveRepository: ReserveRepository,
    private readonly reserveBrokerPaymentRepository: ReserveBrokerPaymentRepository,
  ) {}

  @CrossCuttingConcerns({
    logging: ({
      invoice,
    }: BrokerPaymentContext<CreateBrokerPaymentRequest>) => {
      return {
        message: `Creating a positive reserve for invoice because of a non factored payment`,
        payload: {
          invoice: {
            id: invoice.id,
            loadNumber: invoice.loadNumber,
            accountsReceivableValue: invoice.accountsReceivableValue.toNumber(),
          },
        },
      };
    },
  })
  async run(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<ChangeActions> {
    const { invoice, brokerPayment } = context;
    const reserve = await this.createReserveEntity(invoice);
    this.createReserveBrokerPaymentEntity(reserve, brokerPayment);
    return ChangeActions.empty();
  }

  private async createReserveEntity(
    invoice: InvoiceEntity,
  ): Promise<ReserveEntity> {
    const reserveEntity = new ReserveEntity();
    reserveEntity.clientId = invoice.clientId;
    reserveEntity.amount = invoice.accountsReceivableValue;
    reserveEntity.reason = ReserveReason.ClientCredit;
    reserveEntity.note = `Created a positive reserve for non factored payment`;
    return this.reserveRepository.persist(reserveEntity);
  }

  private createReserveBrokerPaymentEntity(
    reserve: ReserveEntity,
    brokerPayment: BrokerPaymentEntity,
  ): ReserveBrokerPaymentEntity {
    const reserveBrokerPaymentEntity = new ReserveBrokerPaymentEntity();
    reserveBrokerPaymentEntity.reserve = reserve;
    reserveBrokerPaymentEntity.brokerPayment = brokerPayment;
    return this.reserveBrokerPaymentRepository.persist(
      reserveBrokerPaymentEntity,
    );
  }
}
