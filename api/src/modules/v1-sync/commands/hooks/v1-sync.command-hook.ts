import { V1AwareBaseModel } from '@core/data';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { CommandResultType, ICommandHook, RequestCommand } from '@module-cqrs';
import { DatabaseService } from '@module-database';
import { Logger } from '@nestjs/common';

export abstract class V1SyncCommandHook<
  TCommand extends RequestCommand<V1AwareBaseModel<any>, any>,
  TResult = CommandResultType<TCommand>,
> implements ICommandHook<TCommand>
{
  logger: Logger;

  constructor(
    protected readonly featureFlagResolver: FeatureFlagResolver,
    private readonly databaseService: DatabaseService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async beforeCommand(command: TCommand): Promise<void> {
    if (!this.featureFlagResolver.isEnabled(FeatureFlag.SyncV1)) {
      return;
    }
    if (!command.request.ingestThrough) {
      return;
    }
    try {
      await this.doBeforeCommand(command);
    } catch (error) {
      this.logger.error(`Before hook for command failed`, {
        command: command.constructor.name,
        hook: this.constructor.name,
        error: error.message,
      });
      throw error;
    }
  }

  protected async doBeforeCommand(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: TCommand,
  ): Promise<void> {
    // Optional override
  }

  async afterCommand(command: TCommand, result: TResult): Promise<void> {
    if (!this.featureFlagResolver.isEnabled(FeatureFlag.SyncV1)) {
      return;
    }
    if (!command.request.ingestThrough) {
      return;
    }
    await this.databaseService.flush();
    try {
      await this.doAfterCommand(command, result);
    } catch (error) {
      this.logger.error(`Hook for command failed`, {
        command: command.constructor.name,
        hook: this.constructor.name,
        error: error.message,
      });
      throw error;
    }
  }

  protected abstract doAfterCommand(
    command: TCommand,
    result: TResult,
  ): Promise<void>;

  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onCommandError(error: Error): Promise<void> {
    this.logger.error(`Hook for command did not run because of command error`, {
      hook: this.constructor.name,
    });
  }
}
