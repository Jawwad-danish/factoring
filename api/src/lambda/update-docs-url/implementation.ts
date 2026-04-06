import axios, { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import {
  CombineResultPayload,
  DocumentPayload,
  LambdaInvoice,
  LambdaInput,
} from '../types';

export const run = async (
  input: LambdaInput<CombineResultPayload>,
): Promise<LambdaInvoice> => {
  const invoiceDocuments = input.body.documents;
  for (const document of invoiceDocuments) {
    await updateDocument(input, document);
  }
  return input.body;
};

const updateDocument = async (
  input: LambdaInput<CombineResultPayload>,
  document: DocumentPayload,
): Promise<AxiosResponse<any, any>> => {
  const documentUrl = `${process.env.API_URL}/invoices/${input.body.id}/documents`;
  const documentPayload = buildDocumentPayload(document);
  documentPayload.options.sendDocumentAfterProcessingFlag =
    input.body.sendDocumentAfterProcessingFlag;
  console.log(
    `Put document to Url ${documentUrl}, payload ${JSON.stringify(
      documentPayload,
    )}`,
  );
  let result: AxiosResponse;
  const headers = new AxiosHeaders();
  headers.setContentType('application/json');

  if (input.headers?.authorization) {
    headers.setAuthorization(input.headers?.authorization);
  }
  try {
    result = await axios.put(documentUrl, documentPayload, {
      headers,
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.log(`Error on document update `, axiosError.response?.data);
    throw error;
  }
  if (result.status === 200) {
    console.log(`Document with id ${result.data.id} was successfully updated.`);
  }
  return result.data;
};

const buildDocumentPayload = (document: DocumentPayload) => {
  const documentPayload = {
    id: document.id,
    name: document.name,
    internalUrl: document.internalUrl,
    externalUrl: document.externalUrl,
    type: document.type,
    options: { sendDocumentAfterProcessingFlag: false },
  };
  Object.keys(documentPayload).forEach((key) => {
    if (documentPayload[key] == null) {
      delete documentPayload[key];
    }
  });
  return documentPayload;
};
