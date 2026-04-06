import { PageResult, PaginationResult, QueryCriteria } from '@core/data';
import { Arrays, CrossCuttingConcerns } from '@core/util';
import { ClientPayment } from '@fs-bobtail/factoring/data';
import { QueryRunner } from '@module-cqrs';
import { Injectable } from '@nestjs/common';
import { ClientPaymentMapper } from '../mappers';
import { FindClientPaymentQuery, FindClientPaymentsQuery } from '../queries';

@Injectable()
export class ClientPaymentService {
  constructor(
    private readonly queryRunner: QueryRunner,
    private readonly mapper: ClientPaymentMapper,
  ) {}

  @CrossCuttingConcerns<ClientPaymentService, 'findAll'>({
    logging: (clientId: string, criteria: QueryCriteria) => {
      return {
        message: `Fetching all client payments for client ${clientId}`,
        payload: {
          clientId,
          criteria,
        },
      };
    },
  })
  async findAll(
    id: string,
    criteria: QueryCriteria,
  ): Promise<PageResult<ClientPayment>> {
    const { clientPaymentEntities, count } = await this.queryRunner.run(
      new FindClientPaymentsQuery(id, criteria),
    );

    const clientPayments = await Arrays.mapAsync(clientPaymentEntities, (e) =>
      this.mapper.entityToModel(e),
    );

    return new PageResult(
      clientPayments,
      new PaginationResult(criteria.page.page, criteria.page.limit, count),
      {},
    );
  }

  @CrossCuttingConcerns<ClientPaymentService, 'findOne'>({
    logging: (paymentId: string) => {
      return {
        message: `Fetching client payment ${paymentId}`,
        payload: {
          paymentId,
        },
      };
    },
  })
  async findOne(clientId: string, paymentId: string): Promise<ClientPayment> {
    const { clientPaymentEntity } = await this.queryRunner.run(
      new FindClientPaymentQuery(clientId, paymentId),
    );
    return this.mapper.entityToModel(clientPaymentEntity);
  }
}
