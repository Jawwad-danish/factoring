import { SQSEvent, SQSRecord } from 'aws-lambda';
import {
  SFNClient,
  StartExecutionCommand,
  StartExecutionCommandOutput,
} from '@aws-sdk/client-sfn';

const client = new SFNClient({ region: process.env.AWS_REGION });

export const handler = async (event: SQSEvent): Promise<unknown> => {
  runValidations();
  console.log('Received queue event', JSON.stringify(event));

  for (const record of event.Records) {
    await triggerStepFunction(record);
  }
  return;
};

const runValidations = () => {
  if (!process.env.STEP_FUNCTION_ARN) {
    throw new Error('Missing STEP_FUNCTION_ARN environment variable');
  }
};

const triggerStepFunction = async (
  record: SQSRecord,
): Promise<StartExecutionCommandOutput> => {
  const parsedBody = JSON.parse(record.body);
  const authToken = record.messageAttributes['authorizationToken'].stringValue;
  const input = {
    body: parsedBody,
    headers: {
      authorization: authToken,
    },
  };
  const command = new StartExecutionCommand({
    stateMachineArn: process.env.STEP_FUNCTION_ARN,
    input: JSON.stringify(input),
  });
  return client.send(command);
};
