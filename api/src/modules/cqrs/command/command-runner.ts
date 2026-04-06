import { CrossCuttingConcerns } from '@core/util';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Command } from './data';
import { CommandHookManager } from './hook';

@Injectable()
export class CommandRunner {
  logger: Logger = new Logger(CommandRunner.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly commandHookManager: CommandHookManager,
  ) {}

  @CrossCuttingConcerns({
    logging: (command: Command<any>) => {
      return {
        message: `Command ${command.getName()}`,
      };
    },
  })
  async run<TResult>(command: Command<TResult>): Promise<TResult> {
    let result: TResult;
    const hook = this.commandHookManager.findCommandHook(command);
    if (hook?.beforeCommand) {
      await hook.beforeCommand(command);
    }
    try {
      result = await this.commandBus.execute<Command<TResult>, TResult>(
        command,
      );
      command.setResult(result);
    } catch (error) {
      if (hook) {
        await hook.onCommandError(error);
      }
      throw error;
    }

    if (hook) {
      await hook.afterCommand(command, result);
    }
    return result;
  }
}
