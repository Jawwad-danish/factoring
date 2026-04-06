import { environment } from '@core/environment';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { AppModule } from '@module-app';
import { ClientApi } from '@module-clients';
import { DatabaseService } from '@module-database';
import {
  BrokerPaymentStatus,
  InvoiceDocumentType,
  InvoiceEntity,
  InvoiceStatus,
  TagDefinitionGroupEntity,
  TagDefinitionGroupKey,
  TagDefinitionKey,
} from '@module-persistence';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { batchProcess } from '../../core';
import { EmptyReport, run } from '../util';
import {
  Load,
  LoadBobtailData,
  Loads,
  PeruseJob,
  PeruseJobStatus,
} from './data';
import { Peruse } from './peruse';

const scriptOptions = {
  skipClientService: false,
  skipUpdate: true,
};
const logger = new Logger(__filename.replace('ts', ''));
const peruse = new Peruse(
  new HttpService(),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_URL'),
  environment.util.checkAndGetForEnvVariable('SCRIPT_PERUSE_KEY'),
);

const sync = async () => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const clientApi = app.get(ClientApi);

  await databaseService.withRequestContext(async () => {
    const em = RequestContext.getEntityManager();
    if (em) {
      await create(em, clientApi);
    }
  });
};

const create = async (em: EntityManager, clientService: ClientApi) => {
  const loads = Loads.fromJSON(__dirname);
  const nonPaymentReasons = await getNonPaymentReasons(em);
  const invoices = await getInvoices(em);

  const items = await batchProcess(invoices, 5, (invoice) => {
    return save(clientService, invoice, loads, {
      nonPaymentReasons,
    });
  });
  loads.pushAll(items);
  loads.writeJSON(__dirname);
};

const getNonPaymentReasons = async (
  em: EntityManager,
): Promise<TagDefinitionKey[]> => {
  return (
    await em.find(
      TagDefinitionGroupEntity,
      {
        key: TagDefinitionGroupKey.NON_PAYMENT_REASONS,
      },
      {
        populate: ['tags.tag'],
      },
    )
  )
    .flatMap((group) => group.tags.getItems())
    .map((tag) => tag.tag.key);
};

const getInvoices = async (em: EntityManager) => {
  logger.debug(`Fetching invoices from the database`);
  const invoices = await em.find(
    InvoiceEntity,
    {
      status: InvoiceStatus.Purchased,
      brokerPaymentStatus: {
        $in: [
          BrokerPaymentStatus.NotReceived,
          BrokerPaymentStatus.NonPayment,
          BrokerPaymentStatus.NonFactoredPayment,
        ],
      },
    },
    {
      populate: ['activities', 'documents'],
      orderBy: {
        createdAt: 'DESC',
        activities: {
          createdAt: 'ASC',
        },
      },
    },
  );
  logger.debug(
    `Found ${invoices.length} invoices that match the database filter criteria`,
  );
  return invoices;
  // const filtered = invoices.filter((invoice) => {
  //   const activities = invoice.activities;
  //   if (activities.length < 2) {
  //     return false;
  //   }
  //   const payloadData = activities[1].payload['data'];
  //   return (
  //     payloadData?.status?.newValue === 'purchased' &&
  //     payloadData?.status?.oldValue === 'under_review'
  //   );
  // });
  // logger.debug(
  //   `Only ${filtered.length} invoices were created and approved immediately after`,
  // );
  // return filtered;
};

const save = async (
  clientApi: ClientApi,
  invoice: InvoiceEntity,
  loads: Loads,
  options: {
    nonPaymentReasons: TagDefinitionKey[];
  },
): Promise<null | Load> => {
  const foundLoad = loads.findByInvoiceId(invoice.id);
  if (foundLoad) {
    if (!scriptOptions.skipClientService) {
      const client = await clientApi.findById(invoice.clientId);
      if (client) {
        foundLoad.setBobtailData(LoadBobtailData.fromClient(client));
      }
    }
    if (!scriptOptions.skipUpdate) {
      logger.debug(
        `Updating load Bobtail data for invoice with id ${invoice.id}`,
      );
      foundLoad.setBobtailData(LoadBobtailData.fromInvoice(invoice, options));
    }
    return null;
  }

  logger.debug(
    `Creating Peruse load for invoice ${invoice.id} and load ${invoice.loadNumber}`,
  );
  const documents = invoice.documents.filter(
    (document) => document.type === InvoiceDocumentType.Uploaded,
  );
  try {
    const response = await peruse.createLoad({
      items: documents.map((document) => {
        return {
          externalId: document.id,
          url: document.internalUrl || document.externalUrl,
        };
      }),
    });
    const load = new Load()
      .setBobtailData(LoadBobtailData.fromInvoice(invoice, options))
      .setPeruseJobData(
        PeruseJob.fromResponse(response, PeruseJobStatus.Pending),
      );
    const client = await clientApi.findById(invoice.clientId);
    if (client) {
      load.setBobtailData(LoadBobtailData.fromClient(client));
    }
    return load;
  } catch (error) {
    logger.error(
      `Could not send invoice with id ${invoice.id} for processing to Peruse`,
      error,
    );
    return null;
  }
};

run(sync, new EmptyReport(), __dirname, { logError: true });
