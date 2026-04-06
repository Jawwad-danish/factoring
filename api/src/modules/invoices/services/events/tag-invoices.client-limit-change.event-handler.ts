import { ClientEvents, ClientLimitEvent } from '@common/events';
import { Observability } from '@core/observability';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClientLimitTagInvoicesCommand } from '../commands';

@Injectable()
export class TagInvoicesClientLimitChangeEventHandler {
  private logger: Logger = new Logger(
    TagInvoicesClientLimitChangeEventHandler.name,
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly commandRunner: CommandRunner,
  ) {}

  @OnEvent(ClientEvents.Limit, { async: true })
  @Observability.WithScope('tag-invoices-client-limit-change')
  async handle(event: ClientLimitEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.update(event);
      } catch (error) {
        this.logger.error(
          `Could not update tags on invoices for client limit change`,
          error,
        );
      }
    });
  }

  @Transactional(ClientEvents.Limit)
  async update({ clientId }: ClientLimitEvent) {
    await this.commandRunner.run(new ClientLimitTagInvoicesCommand(clientId));
  }
}
