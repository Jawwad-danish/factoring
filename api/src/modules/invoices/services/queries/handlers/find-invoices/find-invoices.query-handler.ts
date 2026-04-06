import {
  FilterCriteria,
  FilterCriteriaValue,
  FilterOperator,
  SortingOrder,
} from '@core/data';
import { getDateInBusinessTimezone } from '@core/date-time';
import { FindOptions, ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import { BrokerService } from '@module-brokers';
import { TransferTimeService } from '@module-common';
import {
  BrokerPaymentStatus,
  ClientFactoringConfigsEntity,
  ClientFactoringStatus,
  InvoiceEntity,
  InvoiceStatus,
  InvoiceTagEntity,
  RecordStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  InvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindInvoiceQueryResult,
  FindInvoicesQuery,
} from '../../find-invoices.query';
import {
  ClientOperatingBalanceCriteria,
  FindInvoiceFilterCriteria,
  InvoiceTagGroupsCriteria,
  InvoiceTagsCriteria,
  TransferTypeFilterCriteria,
} from './find-invoices.filter-criteria';
import { FindInvoiceSortCriteria } from './find-invoices.sort-criteria';
import { buildWhereClauses } from '@module-persistence/repositories';
@QueryHandler(FindInvoicesQuery)
export class FindInvoicesQueryHandler
  implements IQueryHandler<FindInvoicesQuery, FindInvoiceQueryResult>
{
  private logger = new Logger(FindInvoicesQueryHandler.name);

  constructor(
    private invoiceRepository: InvoiceRepository,
    private clientFactoringConfigsRepository: ClientFactoringConfigsRepository,
    private reserveRepository: ReserveRepository,
    private brokerService: BrokerService,
    private transferTimeService: TransferTimeService,
  ) {}

  async execute(query: FindInvoicesQuery): Promise<FindInvoiceQueryResult> {
    const statusValue = query.criteria.filters?.find(
      (data) => data.name === 'status',
    )?.value;

    const { whereClause, findOptions } =
      await this.invoiceRepository.buildQueryConstraints(query.criteria, {
        additionalWhereClause: {
          recordStatus: RecordStatus.Active,
        },
        knownFilterCriteriaOptions: {
          constructor: FindInvoiceFilterCriteria,
          whereClauseGenerator: (input) => this.generateWhereClause(input),
        },
        knownFindOptions: {
          constructor: FindInvoiceSortCriteria,
          findOptionsGenerator: (input) => this.generateFindOptions(input),
        },
      });

    const entitiesPromise = this.invoiceRepository.findAll(
      whereClause,
      findOptions,
    );

    const statsPromise = this.invoiceRepository.getStats(whereClause, {
      amountColumnForTotal: this.determineAmountColumnForTotal(statusValue),
    });

    const [entities, count] = await entitiesPromise;
    const { total } = await statsPromise;

    return { invoiceEntities: entities, count, totalAmount: total };
  }

  private determineAmountColumnForTotal(
    statusValue: FilterCriteriaValue | FilterCriteriaValue[] | undefined,
  ): 'accounts_receivable_value' | 'value' {
    const nonPurchasedStatuses = [
      InvoiceStatus.UnderReview,
      InvoiceStatus.Rejected,
    ];

    const includesNonPurchasedStatuses =
      statusValue &&
      (Array.isArray(statusValue)
        ? statusValue.some((s) =>
            nonPurchasedStatuses.includes(s as InvoiceStatus),
          )
        : nonPurchasedStatuses.includes(statusValue as InvoiceStatus));
    return includesNonPurchasedStatuses ? 'value' : 'accounts_receivable_value';
  }

  async generateFindOptions(
    input: FindInvoiceSortCriteria,
  ): Promise<FindOptions<InvoiceEntity, any>> {
    const findOptions: FindOptions<InvoiceEntity, any> = {};
    const orderBy: QueryOrderMap<InvoiceEntity> = {};
    const populate: (keyof InvoiceEntity)[] = [];
    if (input.brokerUnderReviewTotal) {
      populate.push('brokerUnderReviewTotal');
      orderBy['brokerUnderReviewTotal'] = input.brokerUnderReviewTotal.order;
    }

    if (input.brokerPurchasedTotal) {
      populate.push('brokerPurchasedTotal');
      orderBy['brokerPurchasedTotal'] = input.brokerPurchasedTotal.order;
    }

    if (input.clientUnderReviewTotal) {
      populate.push('clientUnderReviewTotal');
      orderBy['clientUnderReviewTotal'] = input.clientUnderReviewTotal.order;
    }

    if (input.clientPurchasedTotal) {
      populate.push('clientPurchasedTotal');
      orderBy['clientUnderReviewTotal'] = input.clientPurchasedTotal.order;
    }

    if (input.hasIssues) {
      populate.push('hasIssues');
      orderBy['hasIssues'] = input.hasIssues.order;
    }

    if (input.daysSincePurchase) {
      orderBy['daysSincePurchase'] = input.daysSincePurchase.order;
      orderBy['purchasedDate'] = SortingOrder.ASC;
    }

    findOptions.populate = [
      ...populate,
      ...this.invoiceRepository.getDefaultPopulate(),
    ];

    findOptions.orderBy = orderBy;

    return findOptions;
  }

  async generateWhereClause(
    criteria: FindInvoiceFilterCriteria,
  ): Promise<ObjectQuery<InvoiceEntity>> {
    const whereClause: ObjectQuery<InvoiceEntity> = {};

    const clientIdsFilter = await this.getInvoiceClientIdFilter(criteria);
    if (clientIdsFilter === null) {
      // No clients match the input filter - force query result to be empty
      whereClause.id = { $in: [] };
      return whereClause;
    } else {
      whereClause.clientId = clientIdsFilter;
    }

    this.applyStandardFilters(whereClause, criteria);
    await this.handleBrokerTagFilter(whereClause, criteria);
    await this.handleTransferTimeFilter(whereClause, criteria);
    this.handleOutstandingFilter(whereClause, criteria);
    this.handleBuyoutFilter(whereClause, criteria);
    this.handleNonpaymentFilter(whereClause, criteria);
    this.handleLoadNumberFilter(whereClause, criteria);
    this.handleDisplayIdFilter(whereClause, criteria);
    this.handleValueFilter(whereClause, criteria);
    this.handleTagRelatedFilters(whereClause, criteria);
    this.handlePreDefinedFilters(whereClause, criteria);

    return whereClause;
  }

  private async getInvoiceClientIdFilter(
    criteria: FindInvoiceFilterCriteria,
  ): Promise<ObjectQuery<InvoiceEntity>['clientId'] | null> {
    const qb = this.clientFactoringConfigsRepository.queryBuilder();

    const defaultFilter: Partial<ObjectQuery<ClientFactoringConfigsEntity>> = {
      recordStatus: RecordStatus.Active,
    };

    if (criteria.inactiveClients && criteria.inactiveClients.value === true) {
      defaultFilter.status = { $ne: ClientFactoringStatus.Active };
    } else if (criteria.clientStatus && criteria.clientStatus.value) {
      const values = Array.isArray(criteria.clientStatus.value)
        ? criteria.clientStatus.value
        : [criteria.clientStatus.value];
      defaultFilter.status = { $in: values };
    } else {
      defaultFilter.status = { $eq: ClientFactoringStatus.Active };
    }
    // Defaults
    qb.where(defaultFilter);

    if (criteria.clientId) {
      const forcedClientIds = [
        ...(Array.isArray(criteria.clientId.value)
          ? criteria.clientId.value
          : [criteria.clientId.value]),
      ];
      qb.andWhere({ clientId: { $in: forcedClientIds } });
    }

    if (criteria.clientOperatingBalance) {
      const operatingBalanceClientIds =
        await this.handleClientOperatingBalanceFilter(criteria);
      if (operatingBalanceClientIds.length === 0) {
        return null;
      }
      qb.andWhere({ clientId: { $in: operatingBalanceClientIds } });
    }

    if (criteria.vip) {
      qb.andWhere({ vip: { [criteria.vip.operator]: criteria.vip.value } });
    }

    if (criteria.successTeamId) {
      const successTeamClientIds = Array.isArray(criteria.successTeamId.value)
        ? criteria.successTeamId.value
        : [criteria.successTeamId.value];
      qb.andWhere({ clientSuccessTeam: { id: { $in: successTeamClientIds } } });
    }

    const clientIds = (await qb.select('clientId').execute()).map(
      (config) => config.clientId,
    );

    if (clientIds.length === 0) {
      return null;
    }

    return { $in: clientIds };
  }

  private async handleClientOperatingBalanceFilter(
    criteria: FindInvoiceFilterCriteria,
  ): Promise<string[]> {
    if (criteria.clientOperatingBalance) {
      const options = {};
      const filters: ClientOperatingBalanceCriteria[] = Array.isArray(
        criteria.clientOperatingBalance,
      )
        ? criteria.clientOperatingBalance
        : [criteria.clientOperatingBalance];
      for (const filter of filters) {
        if (filter.operator === FilterOperator.LTE) {
          Object.assign(options, {
            lte: filter.value,
          });
        }
        if (filter.operator === FilterOperator.GTE) {
          Object.assign(options, {
            gte: filter.value,
          });
        }
      }

      return await this.reserveRepository.getClientsByBalance(options);
    }
    return [];
  }

  private handlePreDefinedFilters(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.flagged?.value === true) {
      whereClause['hasIssues'] = {
        $eq: true,
      };
    }

    if (criteria.buyout?.value === true) {
      whereClause['buyout'] = {
        $ne: null,
      };
    }
  }

  private handleOutstandingFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (!criteria.outstanding) {
      return;
    }

    const outstandingDates = Array.isArray(criteria.outstanding)
      ? criteria.outstanding
      : [criteria.outstanding];
    whereClause['brokerPaymentStatus'] = BrokerPaymentStatus.NotReceived;
    const outstandingDateRange: Record<string, Date> = {};
    for (const outstandingDate of outstandingDates) {
      if (outstandingDate.operator === FilterOperator.LT) {
        Object.assign(outstandingDateRange, { $lt: outstandingDate.value });
      }
      if (outstandingDate.operator === FilterOperator.GT) {
        Object.assign(outstandingDateRange, { $gt: outstandingDate.value });
      }
    }

    const orConditions: ObjectQuery<InvoiceEntity>[] = [
      {
        buyout: { $eq: null },
        purchasedDate: outstandingDateRange,
      },
      {
        buyout: {
          paymentDate: outstandingDateRange,
        },
      },
    ];

    if (!Array.isArray(whereClause['$and'])) {
      whereClause['$and'] = [];
    }

    whereClause['$and'].push({ $or: orConditions });
  }

  private async handleBrokerTagFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.brokerTag?.value) {
      const brokers = await this.brokerService.findByTagKey(
        criteria.brokerTag.value as TagDefinitionKey,
      );
      whereClause['brokerId'] = {
        $in: brokers.map((broker) => broker.id),
      };
    }
  }

  private async handleTransferTimeFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.clientId) {
      const clientIds = Array.isArray(criteria.clientId.value)
        ? criteria.clientId.value
        : [criteria.clientId.value];
      for (const clientId of clientIds) {
        const clientFactoringConfig =
          await this.clientFactoringConfigsRepository.getOneByClientId(
            clientId,
          );
        if (clientFactoringConfig.expediteTransferOnly) {
          whereClause['expedited'] = {
            $eq: true,
          };
          return;
        }
      }
    }
    if (!criteria.transfer) {
      return;
    }
    const criteriaValue = criteria.transfer.value;
    if (criteriaValue === TransferTypeFilterCriteria.Expedited) {
      whereClause['expedited'] = {
        $eq: true,
      };
    } else {
      whereClause['expedited'] = {
        $eq: false,
      };
      const transferTime = this.transferTimeService.findByName(criteriaValue);
      if (transferTime == null) {
        this.logger.warn('Could not find transfer time by name for filtering', {
          transferTimeFilterValue: criteriaValue,
        });
      } else {
        const currentDateTime = getDateInBusinessTimezone();
        const transferTimeInBusinessTimezone =
          this.transferTimeService.getTransferTimeInBusinessTimezone(
            transferTime,
          );

        if (currentDateTime.isBefore(transferTimeInBusinessTimezone.cutoff)) {
          this.logger.log(
            'No special condition for filtering invoices by transfer time',
          );
          if (transferTime?.previous) {
            const previousTransferTimeInBusinessTimezone =
              this.transferTimeService.getTransferTimeInBusinessTimezone(
                transferTime.previous,
              );

            if (
              previousTransferTimeInBusinessTimezone.cutoff.isAfter(
                currentDateTime,
              )
            ) {
              whereClause['createdAt'] = {
                $gt: previousTransferTimeInBusinessTimezone.cutoff.toISOString(),
              };
            }
          }
        } else if (
          currentDateTime.isAfter(transferTimeInBusinessTimezone.cutoff) &&
          currentDateTime.isBefore(transferTimeInBusinessTimezone.send)
        ) {
          whereClause['createdAt'] = {
            $lt: transferTimeInBusinessTimezone.cutoff.toISOString(),
          };
        } else if (
          currentDateTime.isAfter(transferTimeInBusinessTimezone.send)
        ) {
          whereClause['createdAt'] = {
            $gt: transferTimeInBusinessTimezone.send.toISOString(),
          };
        }
      }
    }
  }

  private async handleBuyoutFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.buyout?.operator === FilterOperator.NOTNULL) {
      whereClause['buyout'] = {
        $ne: null,
      };
    }
  }

  private handleNonpaymentFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.nonpayment) {
      whereClause['$or'] = [
        { brokerPaymentStatus: { $eq: BrokerPaymentStatus.NonPayment } },
        {
          paymentDate: {
            $gt: criteria.nonpayment.value,
          },
        },
      ];
    }
  }

  private handleLoadNumberFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.loadNumber) {
      const filterCriteria: FilterCriteria = {
        name: 'loadNumber',
        operator: criteria.loadNumber.operator,
        value: criteria.loadNumber.value,
      };
      buildWhereClauses(whereClause, filterCriteria);
    }
  }

  private handleDisplayIdFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.displayId) {
      const filterCriteria: FilterCriteria = {
        name: 'displayId',
        operator: criteria.displayId.operator,
        value: criteria.displayId.value,
      };
      buildWhereClauses(whereClause, filterCriteria);
    }
  }

  private handleValueFilter(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (criteria.value) {
      const options = {};
      const valueCriteria = Array.isArray(criteria.value)
        ? criteria.value
        : [criteria.value];
      for (const value of valueCriteria) {
        if (value.operator === FilterOperator.LTE) {
          Object.assign(options, { $lte: value.value });
        }
        if (value.operator === FilterOperator.GTE) {
          Object.assign(options, { $gte: value.value });
        }
      }
      whereClause['value'] = options;
    }
  }

  private handleTagRelatedFilters(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ) {
    if (!criteria.tags && !criteria.tagGroups) {
      return;
    }
    const finalFilter: ObjectQuery<InvoiceTagEntity> = {
      $and: [{ recordStatus: RecordStatus.Active }],
    };

    if (criteria.tags) {
      const tagsFilter = this.generateTagsFilter(criteria);
      if (tagsFilter) {
        finalFilter['$and']?.push(tagsFilter);
      }
    }

    if (criteria.tagGroups) {
      const tagGroupsFilter = this.generateTagGroupsFilter(criteria);
      if (tagGroupsFilter) {
        finalFilter['$and']?.push(tagGroupsFilter);
      }
    }

    whereClause.tags = finalFilter;
  }

  private generateTagsFilter(
    criteria: FindInvoiceFilterCriteria,
  ): ObjectQuery<InvoiceTagEntity> | null {
    if (!criteria.tags) {
      return null;
    }
    const criteriaFilters: InvoiceTagsCriteria[] = Array.isArray(criteria.tags)
      ? criteria.tags
      : [criteria.tags];

    const tagKeyFilter = {};
    for (const filter of criteriaFilters) {
      Object.assign(tagKeyFilter, {
        [filter.operator]: filter.value,
      });
    }

    const tagsWhereClause: ObjectQuery<InvoiceTagEntity> = {
      tagDefinition: {
        key: tagKeyFilter,
      },
    };

    return tagsWhereClause;
  }

  private generateTagGroupsFilter(
    criteria: FindInvoiceFilterCriteria,
  ): ObjectQuery<InvoiceTagEntity> | null {
    if (!criteria.tagGroups) {
      return null;
    }
    const criteriaFilters: InvoiceTagGroupsCriteria[] = Array.isArray(
      criteria.tagGroups,
    )
      ? criteria.tagGroups
      : [criteria.tagGroups];

    const tagGroupKey = {};
    for (const filter of criteriaFilters) {
      Object.assign(tagGroupKey, {
        [filter.operator]: filter.value,
      });
    }

    const tagsWhereClause: ObjectQuery<InvoiceTagEntity> = {
      tagDefinition: {
        group: {
          group: {
            key: tagGroupKey,
          },
        },
      },
    };

    return tagsWhereClause;
  }

  private applyStandardFilters(
    whereClause: ObjectQuery<InvoiceEntity>,
    criteria: FindInvoiceFilterCriteria,
  ): void {
    if (criteria.id) {
      whereClause.id = { [criteria.id.operator]: criteria.id.value };
    }

    if (criteria.status) {
      whereClause.status = {
        [criteria.status.operator]: criteria.status.value,
      };
    }

    if (criteria.createdAt) {
      if (!whereClause.createdAt) {
        whereClause.createdAt = {};
      }

      const createdAtFilters = Array.isArray(criteria.createdAt)
        ? criteria.createdAt
        : [criteria.createdAt];

      for (const filter of createdAtFilters) {
        whereClause.createdAt[filter.operator] = filter.value;
      }
    }

    if (criteria.purchasedDate) {
      if (!whereClause.purchasedDate) {
        whereClause.purchasedDate = {};
      }

      const purchasedAtFilters = Array.isArray(criteria.purchasedDate)
        ? criteria.purchasedDate
        : [criteria.purchasedDate];

      for (const filter of purchasedAtFilters) {
        whereClause.purchasedDate[filter.operator] = filter.value;
      }
    }

    if (criteria.brokerId) {
      whereClause.brokerId = {
        [criteria.brokerId.operator]: criteria.brokerId.value,
      };
    }

    if (criteria.verificationStatus) {
      whereClause.verificationStatus = {
        [criteria.verificationStatus.operator]:
          criteria.verificationStatus.value,
      };
    }

    if (criteria.brokerPaymentStatus) {
      whereClause.brokerPaymentStatus = {
        [criteria.brokerPaymentStatus.operator]:
          criteria.brokerPaymentStatus.value,
      };
    }

    if (criteria.clientPaymentStatus) {
      whereClause.clientPaymentStatus = {
        [criteria.clientPaymentStatus.operator]:
          criteria.clientPaymentStatus.value,
      };
    }

    if (criteria.rejectedDate) {
      whereClause.rejectedDate = {
        [criteria.rejectedDate.operator]: criteria.rejectedDate.value,
      };
    }

    if (criteria.paymentDate) {
      whereClause.paymentDate = {
        [criteria.paymentDate.operator]: criteria.paymentDate.value,
      };
    }

    if (criteria.hasIssues) {
      whereClause.hasIssues = {
        [criteria.hasIssues.operator]: criteria.hasIssues.value,
      };
    }

    if (criteria.isDirty) {
      whereClause.isDirty = {
        [criteria.isDirty.operator]: criteria.isDirty.value,
      };
    }

    if (criteria.expedited) {
      whereClause.expedited = {
        [criteria.expedited.operator]: criteria.expedited.value,
      };
    }
  }
}
