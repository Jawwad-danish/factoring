import { Message } from '@aws-sdk/client-sqs';

export type MessageHandler = (message: Message) => Promise<Message | void>;

export const MESSAGE_CONSUMER = 'MESSAGE_CONSUMER';

export interface MessageConsumer {
  start(handleMessage: MessageHandler): void;
  stop(): void;
}
