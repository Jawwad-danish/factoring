import { Message } from '@aws-sdk/client-sqs';

export interface LocalQueueMessage
  extends Pick<Message, 'MessageId' | 'Body' | 'Attributes'> {}
