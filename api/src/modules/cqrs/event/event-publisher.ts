import { environment } from '@core/environment';
import { CrossCuttingConcerns } from '@core/util';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventPublisher {
  private logger: Logger = new Logger(EventPublisher.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @CrossCuttingConcerns<EventPublisher, 'emit'>({
    logging: (event: string) => {
      return {
        message: `Publishing event ${event}`,
      };
    },
  })
  emit(event: string, ...values: any[]): boolean {
    if (environment.isTest()) {
      this.logger.warn(
        `Skipping event ${event} because it's running in a test environment`,
      );
      return false;
    }

    return this.eventEmitter.emit(event, ...values);
  }
}
