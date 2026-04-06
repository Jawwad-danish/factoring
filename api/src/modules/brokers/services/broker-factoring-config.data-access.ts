import { BrokerFactoringConfigEntity } from '@module-persistence/entities';
import { BrokerFactoringConfigRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';

interface BrokerFetchOptions {
  includeLimitHistory?: boolean;
}

@Injectable()
export class BrokerFactoringConfigDataAccess {
  logger: Logger = new Logger(BrokerFactoringConfigDataAccess.name);
  constructor(private readonly repository: BrokerFactoringConfigRepository) {}

  async flush(): Promise<void> {
    await this.repository.flush();
  }

  async getOrCreateFactoringConfigForBroker(
    brokerId: string,
    options?: BrokerFetchOptions,
  ): Promise<BrokerFactoringConfigEntity> {
    const statsEntity = await this.getOrCreateFactoringConfigForBrokers(
      [brokerId],
      options,
    );
    return statsEntity[0];
  }

  async getOrCreateFactoringConfigForBrokers(
    brokerIds: string[],
    options?: BrokerFetchOptions,
  ): Promise<BrokerFactoringConfigEntity[]> {
    const brokerFactoringConfigs = await this.repository.findByBrokerIds(
      brokerIds,
      options,
    );
    const brokersWithoutConfig = brokerIds.filter(
      (brokerId) =>
        !brokerFactoringConfigs.find((entity) => entity.brokerId === brokerId),
    );
    for (const brokerId of brokersWithoutConfig) {
      brokerFactoringConfigs.push(await this.createFactoringConfig(brokerId));
    }
    return brokerFactoringConfigs;
  }

  private async createFactoringConfig(
    brokerId: string,
  ): Promise<BrokerFactoringConfigEntity> {
    this.logger.log(
      `Creating new factoring config entity for broker ${brokerId}`,
    );
    const brokerFactoringStats = new BrokerFactoringConfigEntity();
    brokerFactoringStats.brokerId = brokerId;
    this.repository.persist(brokerFactoringStats);
    return brokerFactoringStats;
  }
}
