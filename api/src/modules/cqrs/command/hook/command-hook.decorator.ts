import 'reflect-metadata';
import {
  CommandType,
  associateCommandHookTypeWithCommandType,
  registerCommandType,
} from './command-hook.reflection';

export const CommandHook = (commandType: CommandType): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Function) => {
    registerCommandType(commandType);
    associateCommandHookTypeWithCommandType(target, commandType);
  };
};
