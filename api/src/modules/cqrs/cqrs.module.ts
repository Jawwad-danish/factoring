import { AWSModule } from '@module-aws';
import { BobtailConfigModule } from '@module-config';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { CqrsModule as NestCqrsModule } from '@nestjs/cqrs';
import { CommandHookManager, CommandRunner } from './command';
import { QueryRunner } from './query';
import { EventPublisher } from './event';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  providers: [CommandRunner, QueryRunner, CommandHookManager, EventPublisher],
  exports: [CommandRunner, QueryRunner, EventPublisher],
  imports: [
    EventEmitterModule.forRoot(),
    BobtailConfigModule,
    AWSModule,
    NestCqrsModule,
  ],
  controllers: [],
})
export class CqrsModule implements OnApplicationBootstrap {
  constructor(private readonly commandHookManager: CommandHookManager) {}

  onApplicationBootstrap() {
    this.commandHookManager.register();
  }
}
