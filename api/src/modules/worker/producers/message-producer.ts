import { MessagePayload } from '../data/message-payload';

export const MESSAGE_PRODUCER = 'MESSAGE_PRODUCER';

export interface MessageProducer {
  sendMessage<T>(payload: MessagePayload<T>): Promise<void>;
}
