import {
  BrokerEvents,
  BrokerLimitEvent,
  BrokerRatingChangedEvent,
} from '@common';
import { EntityNotFoundError } from '@core/errors';
import { Arrays, CrossCuttingConcerns } from '@core/util';
import { CommandRunner, EventPublisher } from '@module-cqrs';
import { Transactional } from '@module-database';
import {
  BrokerFactoringConfigEntity,
  TagDefinitionKey,
} from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { BrokerApi } from '../api';
import {
  BrokerFactoringConfigMapper,
  BrokerFactoringStatsMapper,
  CreateBrokerContactRequest,
  CreateBrokerRequest,
  Rating,
  UpdateBrokerContactRequest,
  UpdateBrokerFactoringConfigRequest,
  UpdateBrokerRequest,
} from '../data';
import { Broker, BrokerContact, BrokerFactoringStats } from '../data/model';
import { BrokerFactoringConfigDataAccess } from './broker-factoring-config.data-access';
import { BrokerStatsDataAccess } from './broker-stats.data-access';
import {
  CreateBrokerCommand,
  UpdateBrokerCommand,
  CreateBrokerContactCommand,
  UpdateBrokerContactCommand,
  UpdateBrokerFactoringConfigCommand,
} from './commands';
import {
  externalServicesSerializeQueryCriteria,
  FilterCriteria,
  FilterOperator,
  FilterStrategyOps,
  PageCriteria,
  PageResult,
  QueryCriteria,
} from '@core/data';
import {
  BrokerContactUpdateError,
  BrokerCreateError,
  BrokerUpdateError,
  BrokerContactCreateError,
} from './errors';

interface BrokerFetchOptions {
  includeLimitHistory?: boolean;
}

const OBSERVABILITY_TAG = 'broker-service';

@Injectable()
export class BrokerService {
  private logger: Logger = new Logger(BrokerService.name);

  constructor(
    private readonly brokerApi: BrokerApi,
    private readonly statsDataAccess: BrokerStatsDataAccess,
    private readonly factoringConfigDataAccess: BrokerFactoringConfigDataAccess,
    private readonly statsMapper: BrokerFactoringStatsMapper,
    private readonly configMapper: BrokerFactoringConfigMapper,
    private readonly commandRunner: CommandRunner,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async findOneById(id: string): Promise<Broker | null> {
    this.logger.log(`Fetching broker with id: ${id}`);

    const broker = await this.brokerApi.findById(id);
    if (broker) {
      const other = [
        this.loadBrokerStats([broker]),
        this.loadBrokerFactoringConfigs([broker], {
          includeLimitHistory: true,
        }),
      ];
      await Promise.all(other);
    }
    return broker ?? null;
  }

  async getFactoringStatsByBrokerIds(
    brokerIds: string[],
  ): Promise<BrokerFactoringStats[]> {
    // Load stats for brokers that already have existing stats in the database
    const entities = await this.statsDataAccess.findFactoringStatsForBrokers(
      brokerIds,
    );
    const statsForBrokers = await Arrays.mapAsync(entities, (e) =>
      this.statsMapper.entityToModel(e),
    );

    // Determine which brokers need creation of new stats
    const brokerIdsWithStats = new Set(
      statsForBrokers.map((stats) => stats.brokerId),
    );
    const brokersWithoutStats = brokerIds.filter(
      (brokerId) => !brokerIdsWithStats.has(brokerId),
    );

    // Create factoring stats only for brokers found in broker API
    const remainingFactoringStats = (
      await this.findByIds(brokersWithoutStats)
    ).map((broker) => broker.factoringStats);

    return [...statsForBrokers, ...remainingFactoringStats];
  }

  async getFactoringStatsByBrokerId(
    brokerId: string,
  ): Promise<BrokerFactoringStats> {
    const stats = await this.getFactoringStatsByBrokerIds([brokerId]);
    if (stats.length === 0) {
      throw new EntityNotFoundError(
        `Could not find broker with id ${brokerId}`,
      );
    }
    return stats[0];
  }

  async getOneById(id: string): Promise<Broker> {
    const broker = await this.findOneById(id);
    if (broker === null) {
      throw new EntityNotFoundError(`Could not find broker with id ${id}`);
    }
    return broker;
  }

  @Transactional('create-broker')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new BrokerCreateError(cause),
    },
    logging: () => {
      return {
        message: 'Creating broker',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create'],
    },
  })
  async createBroker(
    request: CreateBrokerRequest,
  ): Promise<BrokerFactoringConfigEntity> {
    return await this.commandRunner.run(new CreateBrokerCommand(request));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new BrokerUpdateError(cause),
    },
    logging: () => {
      return {
        message: 'Updating broker',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'update'],
    },
  })
  async updateBroker(
    brokerId: string,
    request: UpdateBrokerRequest,
  ): Promise<BrokerFactoringConfigEntity> {
    const oldBroker = await this.brokerApi.findById(brokerId);

    const brokerConfig = await this.doUpdateBroker(brokerId, request);

    await this.emitRatingChangedEvent(brokerId, request, oldBroker);

    return brokerConfig;
  }

  @Transactional('update-broker')
  private async doUpdateBroker(
    brokerId: string,
    request: UpdateBrokerRequest,
  ): Promise<BrokerFactoringConfigEntity> {
    return await this.commandRunner.run(
      new UpdateBrokerCommand(brokerId, request),
    );
  }

  private async emitRatingChangedEvent(
    brokerId: string,
    request: UpdateBrokerRequest,
    oldBroker: Broker | null,
  ): Promise<void> {
    const RESTRICTED_RATINGS = [Rating.F, Rating.X];

    if (!request.rating || !RESTRICTED_RATINGS.includes(request.rating)) {
      this.logger.log(
        `Broker ${brokerId} rating update skipped: rating is not restricted (${request.rating})`,
      );
      return;
    }

    if (!oldBroker) {
      this.logger.warn(
        `Broker ${brokerId} rating change event skipped: broker not found`,
      );
      return;
    }

    const restrictedRatingStrings = RESTRICTED_RATINGS.map(String);
    if (
      oldBroker.rating === (request.rating as string) ||
      restrictedRatingStrings.includes(oldBroker.rating)
    ) {
      this.logger.log(
        `Broker ${brokerId} rating change event skipped: rating unchanged or already restricted (current: ${oldBroker.rating}, requested: ${request.rating})`,
      );
      return;
    }

    this.logger.log(
      `Broker ${brokerId} rating changed from ${oldBroker.rating} to ${request.rating}, emitting notification event`,
    );
    this.eventPublisher.emit(
      BrokerEvents.RatingChanged,
      new BrokerRatingChangedEvent(
        brokerId,
        oldBroker.legalName,
        request.rating,
      ),
    );
  }

  async findOneByMC(mc: string): Promise<Broker | null> {
    const queryParams: QueryCriteria = new QueryCriteria({
      page: new PageCriteria({
        page: 1,
        limit: 1,
      }),
      filters: [
        new FilterCriteria({
          name: 'mc',
          operator: FilterOperator.IN,
          value: [mc],
        }),
      ],
    });
    const broker = await this.findAll(queryParams);
    return broker.items[0] ?? null;
  }

  async findOneByName(name: string): Promise<Broker | null> {
    const queryParams: QueryCriteria = new QueryCriteria({
      page: new PageCriteria({
        page: 1,
        limit: 1,
      }),
      filters: [
        new FilterCriteria({
          name: 'legalName',
          operator: FilterOperator.ILIKE,
          value: name,
        }),
      ],
    });
    const broker = await this.findAll(queryParams);
    return broker.items[0] ?? null;
  }

  async findByIds(ids: string[]): Promise<Broker[]> {
    if (ids.length === 0) {
      return [];
    }

    this.logger.log(`Fetching brokers ids ${ids}`);

    const brokers = await this.brokerApi.findByIds(ids);
    const other = [
      this.loadBrokerStats(brokers),
      this.loadBrokerFactoringConfigs(brokers),
    ];
    await Promise.all(other);
    return brokers;
  }

  async findByTagKey(tagKey: TagDefinitionKey): Promise<Broker[]> {
    return this.brokerApi.findByTag(tagKey);
  }

  private async loadBrokerFactoringConfigs(
    brokers: Broker[],
    options?: BrokerFetchOptions,
  ): Promise<void> {
    const brokerIds = brokers.map((broker) => broker.id);
    const configsPerBroker =
      await this.factoringConfigDataAccess.getOrCreateFactoringConfigForBrokers(
        brokerIds,
        options,
      );
    await this.factoringConfigDataAccess.flush();

    for (const broker of brokers) {
      const brokerFactoringConfig = configsPerBroker.find(
        (config) => config.brokerId === broker.id,
      );
      if (brokerFactoringConfig) {
        broker.factoringConfig = await this.configMapper.entityToModel(
          brokerFactoringConfig,
        );
      } else {
        this.logger.warn(
          `Could not find broker factoring config for broker ${broker.legalName},  ID: ${broker.id}, MC: ${broker.mc}, DOT: ${broker.dot}`,
        );
      }
    }
  }

  private async loadBrokerStats(brokers: Broker[]): Promise<void> {
    const statsPerBroker =
      await this.statsDataAccess.getOrCreateFactoringStatsForBrokers(
        brokers.map((broker) => broker.id),
      );
    for (const broker of brokers) {
      const brokerStats = statsPerBroker.find(
        (stats) => stats.brokerId === broker.id,
      );
      broker.factoringStats = await this.statsMapper.entityToModel(
        brokerStats!,
      );
    }
  }

  @Transactional('update-broker-factoring-config')
  private async doUpdateBrokerFactoringConfig(
    brokerId: string,
    request: UpdateBrokerFactoringConfigRequest,
  ) {
    return this.commandRunner.run(
      new UpdateBrokerFactoringConfigCommand(brokerId, request),
    );
  }

  async findAll(criteria: QueryCriteria): Promise<PageResult<Broker>> {
    const queryParams = externalServicesSerializeQueryCriteria({
      ...criteria,
      filterStrategy: { filterMode: FilterStrategyOps.OR },
    });
    return await this.brokerApi.findAll(queryParams);
  }

  async updateBrokerFactoringConfig(
    brokerId: string,
    request: UpdateBrokerFactoringConfigRequest,
  ): Promise<BrokerFactoringConfigEntity> {
    const brokerFactoringConfig = await this.doUpdateBrokerFactoringConfig(
      brokerId,
      request,
    );

    if (request.limitAmount !== undefined) {
      this.eventPublisher.emit(
        BrokerEvents.Limit,
        new BrokerLimitEvent(brokerId),
      );
    }

    return brokerFactoringConfig;
  }

  @Transactional('create-broker-contact')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new BrokerContactCreateError(cause),
    },
    logging: () => {
      return {
        message: 'Creating broker contact',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create'],
    },
  })
  async createBrokerContact(
    id: string,
    request: CreateBrokerContactRequest,
  ): Promise<BrokerContact> {
    return await this.commandRunner.run(
      new CreateBrokerContactCommand(id, request),
    );
  }

  @Transactional('update-broker-contact')
  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new BrokerContactUpdateError(cause),
    },
    logging: () => {
      return {
        message: 'Updating broker contact',
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'create'],
    },
  })
  async updateBrokerContact(
    id: string,
    contactId: string,
    request: UpdateBrokerContactRequest,
  ): Promise<BrokerContact> {
    return await this.commandRunner.run(
      new UpdateBrokerContactCommand(id, contactId, request),
    );
  }
}
