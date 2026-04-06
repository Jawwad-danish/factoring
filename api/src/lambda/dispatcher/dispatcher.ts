import { S3Event } from 'aws-lambda';
import { AxiosResponse } from 'axios';
import { AxiosCommand, commandFactory } from './axios-command';

export const dispatch = async (
  event: S3Event,
): Promise<AxiosResponse<any, any>[]> => {
  runValidations();
  console.log('Received event', event);
  const results: AxiosResponse<any, any>[] = [];
  for (const record of event.Records) {
    const command = commandFactory(record);
    if (command === null) {
      continue;
    }

    results.push(await runCommand(command));
  }
  return results;
};

const runValidations = () => {
  if (!process.env.API_URL) {
    throw new Error('Missing API_URL environment variable');
  }
};

const runCommand = async (
  command: AxiosCommand,
): Promise<AxiosResponse<any, any>> => {
  const result = await command.run();
  if (result?.status === 201) {
    console.log(`Command ran successfully`);
  } else if (result === null) {
    console.log(`Command skipped`);
  } else {
  }
  return result?.data;
};
