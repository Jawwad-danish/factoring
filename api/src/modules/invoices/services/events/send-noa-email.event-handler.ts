import { EmailEvents } from '@common';
import { Observability } from '@core/observability';
import { NoticeOfAssignmentEmail } from '@module-email';
import { SendNoaEvent } from '@module-invoices/data';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SendNoaEmailEventHandler {
  private logger: Logger = new Logger(SendNoaEmailEventHandler.name);

  constructor(private readonly noaEmail: NoticeOfAssignmentEmail) {}

  @OnEvent(EmailEvents.Noa, { async: true })
  @Observability.WithScope('send-noa-email')
  async handleSendNoaEmail(event: SendNoaEvent) {
    const { client, broker } = event;
    try {
      await this.noaEmail.send({
        client,
        broker,
      });
    } catch (error) {
      this.logger.error(`Could not send noa email event`, error);
    }
  }
}
