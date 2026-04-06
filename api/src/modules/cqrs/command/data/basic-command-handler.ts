import { ICommandHandler } from '@nestjs/cqrs';
import { Command } from './command';

export type CommandResultType<T> = T extends Command<infer R> ? R : never;

export type BasicCommandHandler<T extends Command<any>> = ICommandHandler<
  T,
  CommandResultType<T>
>;
