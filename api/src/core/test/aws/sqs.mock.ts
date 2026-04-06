import {
  SQSClient,
  SendMessageCommandOutput,
  ReceiveMessageCommandOutput,
  SendMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

export class SQSMock {
  readonly client = mockClient(SQSClient);

  onSendMessageResolve(response: Partial<SendMessageCommandOutput>) {
    this.client.on(SendMessageCommand).resolves(response);
  }

  expectSendMessage() {
    expect(this.client).toHaveReceivedCommandTimes(SendMessageCommand, 1);
  }

  onReceiveMessageResolve(response: Partial<ReceiveMessageCommandOutput>) {
    this.client.on(ReceiveMessageCommand).resolves(response);
  }

  reset() {
    this.client.reset();
  }

  static withDefaults(): SQSMock {
    const mock = new SQSMock();
    mock.onSendMessageResolve({});
    mock.onReceiveMessageResolve({});
    return mock;
  }
}
