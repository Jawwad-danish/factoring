import {
  RecordStatus,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindReservesQuery,
  FindReservesQueryResult,
} from '../find-reserves.query';
import {
  FindReservesFilterCriteria,
  ReserveReasonFilter,
} from './find-reserves.filter-criteria';
import { ObjectQuery } from '@mikro-orm/core';
import { UnknownReserveTypeError } from '../../errors';

@QueryHandler(FindReservesQuery)
export class FindReservesQueryHandler
  implements IQueryHandler<FindReservesQuery, FindReservesQueryResult>
{
  private logger = new Logger(FindReservesQueryHandler.name);

  constructor(private reserveRepository: ReserveRepository) {}

  async execute(query: FindReservesQuery): Promise<FindReservesQueryResult> {
    this.logger.log(
      `Fetching reserves by criteria ${JSON.stringify(query.criteria)}`,
    );
    const [entities, totalCount] =
      await this.reserveRepository.findByQueryCriteria(query.criteria, {
        additionalWhereClause: {
          recordStatus: RecordStatus.Active,
          clientId: query.clientId,
        },
        knownFilterCriteriaOptions: {
          constructor: FindReservesFilterCriteria,
          whereClauseGenerator: (input) => this.generateWhereClause(input),
        },
        populate: ['createdBy'],
      });
    if (totalCount === 0) {
      return {
        entities: [],
        totalAmount: 0,
        totalCount: 0,
      };
    }
    const totalAmount = await this.reserveRepository.getTotalByClient(
      query.clientId,
      {
        from: entities[0].createdAt,
      },
    );

    return {
      entities,
      totalCount,
      totalAmount,
    };
  }

  async generateWhereClause(
    criteria: FindReservesFilterCriteria,
  ): Promise<ObjectQuery<ReserveEntity>> {
    const whereClause: ObjectQuery<ReserveEntity> = {};
    if (criteria.reason?.value) {
      switch (criteria.reason.value) {
        case ReserveReasonFilter.NonPayment:
          whereClause['reason'] = {
            $eq: ReserveReason.NonPayment,
          };
          break;
        case ReserveReasonFilter.Overpay:
          whereClause['reason'] = {
            $eq: ReserveReason.Overpay,
          };
          break;
        case ReserveReasonFilter.Shortpay:
          whereClause['reason'] = {
            $eq: ReserveReason.Shortpay,
          };
          break;
        case ReserveReasonFilter.Chargeback:
          whereClause['reason'] = {
            $eq: ReserveReason.Chargeback,
          };
          break;
        case ReserveReasonFilter.Adjustment:
          whereClause['reason'] = {
            $in: this.getAdjustmentReasons(),
          };
          break;
        default:
          throw new UnknownReserveTypeError(criteria.reason?.value);
      }
    }
    return whereClause;
  }

  private getAdjustmentReasons(): ReserveReason[] {
    return [
      ReserveReason.ReleaseOfFunds,
      ReserveReason.ReleaseToThirdParty,
      ReserveReason.NonFactoredPayment,
      ReserveReason.ClientCredit,
      ReserveReason.OverAdvance,
      ReserveReason.DirectPaymentByClient,
      ReserveReason.WriteOff,
      ReserveReason.Fee,
      ReserveReason.BrokerClaim,
      ReserveReason.BalanceTransferFromPositive,
      ReserveReason.BalanceTransferToPositive,
    ];
  }
}
