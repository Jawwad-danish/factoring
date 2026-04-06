import * as SQS from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { environment } from '@core/environment';

@Injectable()
export class SQSService {
  private readonly client: SQS.SQSClient = new SQS.SQSClient({
    region: environment.aws.defaultRegion(),
    endpoint: environment.aws.defaultEndpoint('sqs'),
  });
  private readonly logger: Logger = new Logger(SQSService.name);

  async sendMessage(
    queueURL: string,
    messageBody: string,
    options?: Partial<SQS.SendMessageRequest>,
  ): Promise<SQS.SendMessageCommandOutput> {
    const params: SQS.SendMessageCommandInput = {
      ...options,
      QueueUrl: queueURL,
      MessageBody: messageBody,
    };
    try {
      const command = new SQS.SendMessageCommand(params);
      return this.client.send(command);
    } catch (error) {
      this.logger.error(`Could not send message to SQS Queue ${error}`);
      throw error;
    }
  }

  async receiveMessage(
    queueURL: string,
    options?: Partial<SQS.ReceiveMessageCommandInput>,
  ): Promise<SQS.Message[]> {
    const params: SQS.ReceiveMessageCommandInput = {
      ...options,
      QueueUrl: queueURL,
    };
    try {
      const command = new SQS.ReceiveMessageCommand(params);
      return (await this.client.send(command)).Messages ?? [];
    } catch (error) {
      this.logger.error(
        `Could not receive message from SQS Queue ${queueURL},
        ${error}`,
      );
      throw error;
    }
  }
}
