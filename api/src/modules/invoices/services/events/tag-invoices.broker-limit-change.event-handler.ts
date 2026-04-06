import { BrokerEvents, BrokerLimitEvent } from '@common';
import { Observability } from '@core/observability';
import { BrokerLimitTagInvoiceCommand } from '@module-brokers/commands';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class TagInvoicesBrokerLimitChangeEventHandler {
  private logger: Logger = new Logger(
    TagInvoicesBrokerLimitChangeEventHandler.name,
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly commandRunner: CommandRunner,
  ) {}

  @OnEvent(BrokerEvents.Limit, { async: true })
  @Observability.WithScope('tag-invoices-broker-limit-change')
  async handle(event: BrokerLimitEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.update(event);
      } catch (error) {
        this.logger.error(
          `Could not update tags on invoices for broker limit change`,
          error,
        );
      }
    });
  }

  @Transactional(BrokerEvents.Limit)
  async update(event: BrokerLimitEvent) {
    await this.commandRunner.run(
      new BrokerLimitTagInvoiceCommand(event.brokerId),
    );
  }
}
