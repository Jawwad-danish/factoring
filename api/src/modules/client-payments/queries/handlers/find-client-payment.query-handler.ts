import { EntityNotFoundError } from '@core/errors';
import { RecordStatus } from '@module-persistence/entities';
import { ClientPaymentRepository } from '@module-persistence/repositories';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindClientPaymentQuery,
  FindClientPaymentQueryResult,
} from '../find-client-payment.query';

@QueryHandler(FindClientPaymentQuery)
export class FindClientPaymentQueryHandler
  implements
    IQueryHandler<FindClientPaymentQuery, FindClientPaymentQueryResult>
{
  constructor(private clientPaymentRepository: ClientPaymentRepository) {}

  async execute(
    query: FindClientPaymentQuery,
  ): Promise<FindClientPaymentQueryResult> {
    const clientPayment = await this.clientPaymentRepository.findOne(
      {
        id: query.paymentId,
        clientId: query.clientId,
        recordStatus: RecordStatus.Active,
      },
      {
        populate: [
          'createdBy',
          'reservePayments',
          'reservePayments.reserve',
          'invoicePayments.invoice',
        ],
      },
    );
    if (!clientPayment) {
      throw new EntityNotFoundError(
        `Could not find client payment with id ${query.paymentId} for client ${query.clientId}`,
      );
    }

    return {
      clientPaymentEntity: clientPayment,
    };
  }
}
