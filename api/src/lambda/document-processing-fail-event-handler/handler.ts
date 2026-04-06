import axios, { AxiosHeaders, AxiosResponse } from 'axios';
import 'reflect-metadata';
import {
  DocumentGenerationEvent,
  StepFunctionEvent,
  logStringify,
  toClassAndValidate,
} from '../common';

export const handler = async (lambdaEvent: object): Promise<any> => {
  logStringify('Lambda event', lambdaEvent);
  const stepFunctionEvent = await toClassAndValidate(
    StepFunctionEvent,
    lambdaEvent,
  );
  const documentGenerationEvent = await extractFromInput(stepFunctionEvent);
  logStringify('Document generation event: ', documentGenerationEvent);
  return await sendRequest(documentGenerationEvent);
};

const extractFromInput = (event: StepFunctionEvent) => {
  const parsed = parse(event.detail.input);
  return toClassAndValidate(DocumentGenerationEvent, parsed);
};

const parse = (input: string): object => {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error('Could not parse as JSON event->detail->input');
  }
};

const sendRequest = async (
  event: DocumentGenerationEvent,
): Promise<AxiosResponse> => {
  const url = `${process.env.API_URL}/invoices/${event.body.id}/documents/generation-failure`;
  const headers = new AxiosHeaders();
  headers.setContentType('application/json');
  headers.setAuthorization(event.headers.authorization);
  try {
    return axios.post(url, undefined, {
      headers,
    });
  } catch (error) {
    console.error(
      `Could not mark invoice document generation as failure for ${event.body.id}`,
    );
    throw error;
  }
};
