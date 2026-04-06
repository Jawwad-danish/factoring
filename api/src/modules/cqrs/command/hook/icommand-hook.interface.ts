import { Command, CommandResultType } from '../data';

export interface ICommandHook<
  TCommand extends Command<any>,
  TResult = CommandResultType<TCommand>,
> {
  beforeCommand?(command: TCommand): Promise<void>;

  afterCommand(command: TCommand, result: TResult): Promise<void>;

  onCommandError(error: Error): Promise<void>;
}
