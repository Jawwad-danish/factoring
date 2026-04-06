import { INestApplicationContext } from '@nestjs/common';
import { Convert } from '@core/services';
import { environment } from '@core/environment';
import { S3ObjectLocator } from '../../modules/aws/s3/s3-object-locator';
import { S3Service } from '../../modules/aws/s3/s3.service';
import {
  DocumentPayload,
  InvoiceCoverResultPayload,
  CombineResultPayload,
  LambdaInvoice,
} from '../types';

export const run = async (
  app: INestApplicationContext,
  convert: Convert,
  payloads: (InvoiceCoverResultPayload | LambdaInvoice)[],
): Promise<CombineResultPayload> => {
  let invoiceFirstPage!: string;
  let invoicePayload!: LambdaInvoice;

  for (const payload of payloads) {
    if ('coverDocumentUrl' in payload) {
      invoiceFirstPage = payload.coverDocumentUrl;
    } else {
      invoicePayload = payload;
    }
  }
  const documentCombinedUrl = await combineAndSaveDocuments(
    invoicePayload,
    invoiceFirstPage,
    convert,
    app,
  );

  invoicePayload.documents.push(addCombinedDoc(documentCombinedUrl));

  return {
    ...invoicePayload,
    documentCombinedUrl: documentCombinedUrl,
  };
};

export const combineAndSaveDocuments = async (
  invoicePayload: LambdaInvoice,
  invoiceDocumentFirstPage: string,
  convert: Convert,
  app: INestApplicationContext,
): Promise<string> => {
  const s3DocumentName = `COMBINED-${invoicePayload.loadNumber}-${
    invoicePayload.id
  }-${new Date().getTime()}.pdf`;
  const documentsUrl: string[] = [];
  documentsUrl.push(invoiceDocumentFirstPage);
  console.log(
    `Get ${invoicePayload.documents.length} invoice documents for combine`,
  );
  for (const document of invoicePayload.documents) {
    documentsUrl.push(document.internalUrl);
  }
  const combinedPdfResult = await convert.merge(documentsUrl);
  console.log(`Combined convertapi pdf url ${combinedPdfResult}`);
  return await saveToS3(combinedPdfResult, s3DocumentName, app);
};

export const saveToS3 = async (
  url: string,
  name: string,
  app: INestApplicationContext,
): Promise<string> => {
  const s3Service = (await app).get(S3Service);
  const destination = new S3ObjectLocator(
    environment.lambda.bucket(),
    name,
    true,
  );
  console.log(`Save file to S3 destination: ${destination}.`);
  const s3Response = await s3Service.putObjectFromURL(url, destination);
  if (s3Response.$metadata.httpStatusCode == 200) {
    console.log(
      `Document was copied to s3 bucket to ${destination.getBucket()} with key ${destination.getKey()}`,
    );
  }
  const s3CombinedUrl = `https://${destination.getBucket()}.s3.amazonaws.com/${encodeURIComponent(
    destination.getKey(),
  )}`;
  console.log(`S3 combined document Url ${s3CombinedUrl}`);
  return s3CombinedUrl;
};

const addCombinedDoc = (url: string): DocumentPayload => {
  const docName = url.substring(url.lastIndexOf('/') + 1);
  return {
    name: docName,
    type: 'generated',
    internalUrl: url,
    externalUrl: url,
  };
};
