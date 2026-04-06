import { SQSService } from './sqs.service';
import { mockClient } from 'aws-sdk-client-mock';
import {
  Message,
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';

const AWS_SQS_CLIENT_MOCK = mockClient(SQSClient);

function mockReceiveMessageResponse(messageList: string[]): void {
  const messageListSQS = messageList.map((message): Message => {
    return { Body: message };
  }) as Message[];
  AWS_SQS_CLIENT_MOCK.on(ReceiveMessageCommand).resolves({
    Messages: messageListSQS,
  });
}

beforeEach(() => {
  AWS_SQS_CLIENT_MOCK.reset();
  jest.clearAllMocks();
});

describe('SQS Service', () => {
  test('Send message', async () => {
    const sqsService = new SQSService();
    const queueURL = 'http://sqs.mocked.com/123/myQueue';
    const message = 'myMessage';

    AWS_SQS_CLIENT_MOCK.on(SendMessageCommand).resolves({ MessageId: '1' });

    const response = await sqsService.sendMessage(queueURL, message);
    expect(response.MessageId).toBe('1');
  });
  test('Receive message', async () => {
    const sqsService = new SQSService();
    const queueURL = 'http://sqs.mocked.com/123/myQueue';
    mockReceiveMessageResponse(['message_1', 'message_2']);
    const expectedMessages = [{ Body: 'message_1' }, { Body: 'message_2' }];

    const messageList = await sqsService.receiveMessage(queueURL);
    expect(messageList).toEqual(expectedMessages);
  });
});
