import { Type } from '@nestjs/common';
import { UUID } from '@core/uuid';
import { Command } from '../data';
import { ICommandHook } from './icommand-hook.interface';

export const METADATA_COMMAND = '__cqrs__commands__';
export const METADATA_HOOK = '__cqrs__hooks__';

export type CommandType = Type<Command<any>>;
export type CommandHookType = Type<ICommandHook<Command<any>>>;

export const registerCommandType = (commandType: CommandType) => {
  if (!Reflect.hasOwnMetadata(METADATA_COMMAND, commandType)) {
    Reflect.defineMetadata(METADATA_COMMAND, { id: UUID.get() }, commandType);
  }
};

export const associateCommandHookTypeWithCommandType = (
  commandHookType: object,
  commandType: CommandType,
) => {
  Reflect.defineMetadata(METADATA_HOOK, commandType, commandHookType);
};

export const isTypeRegisteredCommandHookType = (anyType: Type<any>) => {
  return Reflect.hasMetadata(METADATA_HOOK, anyType);
};

export const findCommandIdByCommand = (
  command: Command<any>,
): null | string => {
  const metadata = Reflect.getMetadata(METADATA_COMMAND, command.constructor);
  if (!metadata) {
    return null;
  }
  return metadata.id as string;
};

export const findCommandIdByCommandHookType = (
  commandHookType: CommandHookType,
): null | string => {
  const commandType = Reflect.getMetadata(METADATA_HOOK, commandHookType);
  if (!commandType) {
    return null;
  }
  const commandTypeMetadata = Reflect.getMetadata(
    METADATA_COMMAND,
    commandType,
  );
  if (!commandTypeMetadata) {
    return null;
  }
  return commandTypeMetadata.id;
};
