import * as Handlebars from 'handlebars';

import { environment } from '@core/environment';
import { AWSModule, S3ObjectLocator, S3Service } from '@module-aws';
import { INestApplicationContext } from '@nestjs/common';
import { Readable } from 'stream';
import { getConfigFromAppConfig } from '../common/app-config';
import { buildConvertAPIClient } from '../common/convert';
import { createLambdaNestContext } from '../common/nest-context';
import { LambdaBroker, LambdaInvoice } from '../types';

interface CoverTemplateBroker {
  dba?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  broker?: {
    mc?: string;
    dot?: string;
  };
}
interface CoverTemplateClient {
  name: string;
  dba?: string;
  mc: string;
  dot: string;
}
interface CoverTemplateParams {
  displayID: string;
  createdAt: string;
  recipient: string;
  broker: CoverTemplateBroker;
  client: CoverTemplateClient;
  note?: string;
  invoice: {
    loadNumber: string;
    lineHaulRate?: string;
    lumper?: string;
    detention?: string;
    advance?: string;
    totalAmount: string;
  };
  displaySeparators: {
    displayFirst?: boolean;
    displaySecond?: boolean;
    displayThird?: boolean;
  };
  tenant: {
    remitEmail: string;
    achRoutingNumber: string;
    achAccountNumber: string;
    mailingAddress: string;
    mailingAddress2?: string;
    mailingCity: string;
    mailingState: string;
    mailingZip: string;
    invoiceEmail: string;
    websiteURL: string;
    phone: string;
  };
}

const BrokerNotFound: CoverTemplateBroker = {
  dba: '-',
  address: '-',
  address2: '-',
  city: '-',
  state: '-',
  zip: '-',
  broker: {
    mc: '-',
    dot: '-',
  },
};

export const run = async (payload: LambdaInvoice) => {
  const app = await createLambdaNestContext(AWSModule);
  const templateString = await loadTemplate(app);
  const htmlTemplate = Handlebars.compile(templateString);
  const templateParams = generateTemplateParams(payload);
  const generatedHTML = htmlTemplate(templateParams);
  const generatedHTMLURL = await uploadGeneratedHTMLToS3(
    app,
    payload.id,
    generatedHTML,
  );
  const convertAPIURL = await convertToPDF(app, generatedHTMLURL);
  return uploadGeneratedPDFToS3(app, payload.id, convertAPIURL);
};

async function loadTemplate(app: INestApplicationContext): Promise<string> {
  const locator = await getInvoiceCoverLocator();
  const s3Service = app.get(S3Service);
  const { Body } = await s3Service.getObject(locator);
  return streamToString(Body as Readable);
}
export const getInvoiceCoverLocator = async (): Promise<S3ObjectLocator> => {
  const templateBucket = await getConfigFromAppConfig(
    'INVOICE_COVER_TEMPLATE_BUCKET',
  );
  const templateKey = await getConfigFromAppConfig(
    'INVOICE_COVER_TEMPLATE_KEY',
  );
  return new S3ObjectLocator(templateBucket, templateKey as string);
};

const streamToString = (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

function generateTemplateParams(invoice: LambdaInvoice): CoverTemplateParams {
  // logic for which table lines to show
  let displayFirst = false,
    displaySecond = false,
    displayThird = false;
  if (
    invoice.lineHaulRate != null &&
    ((invoice.lumper != null && invoice.detention != null) ||
      invoice.advance != null)
  ) {
    displayFirst = true;
  }

  if (
    invoice.lumper != null &&
    (invoice.detention != null || invoice.advance != null)
  ) {
    displaySecond = true;
  }

  if (invoice.detention != null && invoice.advance != null) {
    displayThird = true;
  }
  return {
    displayID: invoice.displayId,
    createdAt: invoice.createdAt,
    recipient: invoice.broker?.legalName
      ? invoice.broker.legalName.toLocaleUpperCase()
      : 'Broker Not Found',
    broker: mapInvoiceBrokerToPayload(invoice.broker),
    client: invoice.client
      ? {
          name: invoice.client.name,
          mc: invoice.client.mc,
          dot: invoice.client.dot,
          dba: invoice.client.doingBusinessAs,
        }
      : {
          name: '-',
          mc: '-',
          dot: '-',
          dba: '-',
        },
    note: invoice.note,
    invoice: {
      loadNumber: invoice.loadNumber,
      totalAmount: formatMonetaryValue(invoice.totalAmount),
      lineHaulRate: formatMonetaryValue(invoice.lineHaulRate),
      lumper: formatMonetaryValue(invoice.lumper),
      detention: formatMonetaryValue(invoice.detention),
      advance: formatMonetaryValue(invoice.advance),
    },
    displaySeparators: {
      displayFirst: displayFirst,
      displaySecond: displaySecond,
      displayThird: displayThird,
    },
    tenant: {
      remitEmail: 'ach@bobtail.com',
      achAccountNumber: '4451677570',
      achRoutingNumber: '111000012',
      mailingAddress: 'PO Box 7410633',
      mailingCity: 'Chicago',
      mailingState: 'IL',
      mailingZip: '60674-0633',
      websiteURL: 'https://www.bobtail.com/',
      invoiceEmail: 'invoices@bobtail.com',
      phone: '(410) 204 - 2084',
    },
  };
}
async function convertToPDF(
  app: INestApplicationContext,
  generatedHTMLURL: string,
): Promise<string> {
  const client = await buildConvertAPIClient(app);
  return client.urlToPDF(generatedHTMLURL);
}

async function uploadGeneratedHTMLToS3(
  app: INestApplicationContext,
  invoiceID: string,
  content: string,
): Promise<string> {
  const s3Service = app.get(S3Service);
  const destination = new S3ObjectLocator(
    environment.lambda.bucket(),
    `html-covers/${invoiceID}-invoice-cover.html`,
    true,
  );
  await s3Service.putObject({ data: content, type: 'text/html' }, destination);
  return `https://${destination.getBucket()}.s3.amazonaws.com/${encodeURIComponent(
    destination.getKey(),
  )}`;
}

async function uploadGeneratedPDFToS3(
  app: INestApplicationContext,
  invoiceID: string,
  convertAPIURL: string,
) {
  const s3Service = app.get(S3Service);
  const destination = new S3ObjectLocator(
    environment.lambda.bucket(),
    `${invoiceID}-invoice-cover.pdf`,
    true,
  );
  await s3Service.putObjectFromURL(convertAPIURL, destination);
  return `https://${destination.getBucket()}.s3.amazonaws.com/${encodeURIComponent(
    destination.getKey(),
  )}`;
}

const formatMonetaryValue = (value: number): string => {
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
};

const mapInvoiceBrokerToPayload = (
  broker: LambdaBroker | null,
): CoverTemplateBroker => {
  if (broker === null) {
    return BrokerNotFound;
  }

  const mappedBroker: CoverTemplateBroker = { ...BrokerNotFound };
  const officeBrokerAddress = broker.addresses.find(
    (address) => address.type === 'office',
  );

  if (officeBrokerAddress) {
    mappedBroker.address = officeBrokerAddress.address ?? mappedBroker.address;
    mappedBroker.address2 =
      officeBrokerAddress.streetAddress ?? mappedBroker.address2;
    mappedBroker.city = officeBrokerAddress.city ?? mappedBroker.city;
    mappedBroker.state = officeBrokerAddress.state ?? mappedBroker.state;
    mappedBroker.zip = officeBrokerAddress.zip ?? mappedBroker.zip;
  }
  mappedBroker.dba = broker.doingBusinessAs ?? mappedBroker.dba;
  mappedBroker.broker = {
    mc: broker.mc ?? mappedBroker.broker?.mc,
    dot: broker.dot ?? mappedBroker.broker?.dot,
  };
  return mappedBroker;
};
