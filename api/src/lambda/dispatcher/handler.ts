import { S3Event } from 'aws-lambda';
import { dispatch } from './dispatcher';

export const handler = async (event: S3Event): Promise<unknown> => {
  console.log('Received event', JSON.stringify(event));

  return dispatch(event);
};
