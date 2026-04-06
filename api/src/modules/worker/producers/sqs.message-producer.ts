import { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { SQSService } from '@module-aws';
import { Logger } from '@nestjs/common';
import { MessagePayload } from '../data';
import { MessageProducer } from './message-producer';

export class SqsMessageProducer implements MessageProducer {
  private readonly logger = new Logger(SqsMessageProducer.name);

  constructor(
    private readonly queueUrl: string,
    private readonly sqsService: SQSService,
  ) {}

  async sendMessage<T>(payload: MessagePayload<T>): Promise<void> {
    try {
      const messageOptions: Partial<SendMessageCommandInput> = {
        MessageGroupId: payload.id,
      };
      const messageBody = JSON.stringify(payload);
      this.logger.log(
        `Sending message to SQS queue ${this.queueUrl} for job ${payload.id}`,
      );
      await this.sqsService.sendMessage(
        this.queueUrl,
        messageBody,
        messageOptions,
      );
      this.logger.log(
        `Successfully sent message for job ${payload.id} to ${this.queueUrl}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message for job ${payload.id} to queue ${this.queueUrl}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
