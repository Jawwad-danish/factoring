import { Injectable, Type } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { Command } from '../data';
import {
  CommandHookType,
  findCommandIdByCommand,
  findCommandIdByCommandHookType,
  isTypeRegisteredCommandHookType,
} from './command-hook.reflection';
import { ICommandHook } from './icommand-hook.interface';

@Injectable()
export class CommandHookManager {
  private commandHooks = new Map<string, ICommandHook<Command<any>>>();

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly moduleRef: ModuleRef,
  ) {}

  register() {
    const commandHookTypes = this.getCommandHookTypes();
    for (const commandHookType of commandHookTypes) {
      const instance = this.moduleRef.get(commandHookType, {
        strict: false,
      });
      const commandId = findCommandIdByCommandHookType(commandHookType);
      if (commandId) {
        this.commandHooks.set(commandId, instance);
      }
    }
  }

  private getCommandHookTypes(): CommandHookType[] {
    const list: CommandHookType[] = [];
    for (const container of this.modulesContainer.values()) {
      for (const provider of container.providers.values()) {
        const { instance } = provider;
        if (!instance) {
          continue;
        }
        if (
          isTypeRegisteredCommandHookType(instance.constructor as Type<any>)
        ) {
          list.push(instance.constructor as CommandHookType);
        }
      }
    }
    return list;
  }

  findCommandHook<T>(command: Command<T>): null | ICommandHook<Command<T>> {
    const commandId = findCommandIdByCommand(command);
    if (!commandId) {
      return null;
    }
    return this.commandHooks.get(commandId) ?? null;
  }
}
