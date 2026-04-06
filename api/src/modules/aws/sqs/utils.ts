import { MessageAttributeValue } from '@aws-sdk/client-sqs';

export function buildMessageAttributes(
  headers: Record<string, string>,
): Record<string, MessageAttributeValue> {
  const messageAttributes: Record<string, MessageAttributeValue> = {};
  for (const key in headers) {
    messageAttributes[key] = {
      DataType: 'String',
      StringValue: headers[key],
    };
  }
  return messageAttributes;
}
