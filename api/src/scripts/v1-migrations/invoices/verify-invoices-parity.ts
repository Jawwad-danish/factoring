import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  ClientPaymentStatus,
  InvoiceDocumentEntity,
  InvoiceEntity,
  RecordStatus,
  TagDefinitionEntity,
} from '@module-persistence/entities';
import {
  InvoiceRepository,
  TagDefinitionRepository,
} from '@module-persistence/repositories';
import { NestFactory } from '@nestjs/core';
import { ParityItemProvider } from 'src/scripts/util/parity/parity-item-provider';
import { AppModule } from '../../../modules/app/app.module';
import { useRequestContext } from '../../util';
import {
  FieldEqualityManager,
  MasterParityReport,
  ParityChecker,
  ParityReport,
  verifyParity,
} from '../../util/parity';
import { buildCompleteInvoiceEntity } from './invoice-mapper';

class ClientPaymentStatusEqualityManager extends FieldEqualityManager<InvoiceEntity> {
  constructor() {
    super('clientPaymentStatus');
  }
  areFieldsEqual(v1Entity: InvoiceEntity, v2Entity: InvoiceEntity): boolean {
    const areFieldsEqual = this.defaultEqualityChecker(v1Entity, v2Entity);
    // V1 client payment status is always 'processing' on the invoice level after the payment has been sent
    if (
      !areFieldsEqual &&
      v1Entity.clientPaymentStatus === ClientPaymentStatus.Sent &&
      [ClientPaymentStatus.InProgress, ClientPaymentStatus.Sent].includes(
        v2Entity.clientPaymentStatus,
      )
    ) {
      return true;
    }
    return areFieldsEqual;
  }
}

const report = new ParityReport('invoices', 'id', true);
class InvoiceParityChecker extends ParityChecker<InvoiceEntity> {
  async checkRawEquality(
    v1Object: any,
    v2Object: InvoiceEntity,
  ): Promise<void> {
    const v1InvoiceUpdatesCount = (v1Object.invoice_updates || []).length;
    const v2ActivitiesCount = v2Object.activities
      .toJSON()
      .filter(
        (activity) => activity.recordStatus === RecordStatus.Active,
      ).length;

    const v1DocumentsCount = (v1Object.invoice_documents || []).length;
    const v2DocumentsCount = v2Object.documents
      .toJSON()
      .filter(
        (document) => document.recordStatus === RecordStatus.Active,
      ).length;

    const isDocumentsCountEqual = v1DocumentsCount === v2DocumentsCount;
    const isUpdatesCountEqual = v1InvoiceUpdatesCount === v2ActivitiesCount;

    if (!isUpdatesCountEqual) {
      const difference = {
        key: 'activties_count' as keyof InvoiceEntity,
        v1Value: v1InvoiceUpdatesCount,
        v2Value: v2ActivitiesCount,
      };
      this.report.addDifference(v2Object, difference);
    }

    if (!isDocumentsCountEqual) {
      const difference = {
        key: 'documents_count' as keyof InvoiceEntity,
        v1Value: v1DocumentsCount,
        v2Value: v2DocumentsCount,
      };
      this.report.addDifference(v2Object, difference);
    }
  }
}

const invoiceParityChecker = new InvoiceParityChecker(
  [
    new FieldEqualityManager('clientId'),
    new FieldEqualityManager('brokerId'),
    new FieldEqualityManager('displayId'),
    new FieldEqualityManager('loadNumber'),
    new FieldEqualityManager('lineHaulRate'),
    new FieldEqualityManager('lumper'),
    new FieldEqualityManager('detention'),
    new FieldEqualityManager('advance'),
    new FieldEqualityManager('paymentDate'),
    new FieldEqualityManager('expedited'),
    new FieldEqualityManager('accountsReceivableValue'),
    new FieldEqualityManager('value'),
    new FieldEqualityManager('approvedFactorFee', {
      number: {
        ignoreDecimals: true,
        roundingMode: 1,
      },
    }),
    new FieldEqualityManager('reserveFee', {
      number: {
        ignoreDecimals: true,
        roundingMode: 1,
      },
    }),
    new FieldEqualityManager('memo'),
    new FieldEqualityManager('note'),
    new FieldEqualityManager('status'),
    new FieldEqualityManager('rejectedDate'),
    new FieldEqualityManager('purchasedDate'),
    new FieldEqualityManager('brokerPaymentStatus'),
    new ClientPaymentStatusEqualityManager(),
  ],
  report,
);

const tagParityChecker = new ParityChecker<TagDefinitionEntity>(
  [new FieldEqualityManager('name'), new FieldEqualityManager('key')],
  new ParityReport('tags', 'key'),
);
const documentParityChecker = new ParityChecker<InvoiceDocumentEntity>(
  [
    new FieldEqualityManager('name'),
    new FieldEqualityManager('label'),
    new FieldEqualityManager('type'),
    new FieldEqualityManager('internalUrl'),
  ],
  new ParityReport('documents', 'id'),
);

export const verifyInvoicesParity = async (
  masterReport: MasterParityReport,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const tagRepository = app.get(TagDefinitionRepository);
  const tagDefinitions = await useRequestContext(databaseService, () =>
    tagRepository.findAll({}),
  );
  masterReport.addReport(report);
  await verifyParity<InvoiceEntity>({
    path: environment.util.checkAndGetForEnvVariable(
      'SCRIPT_IMPORT_INVOICES_PATH',
    ),
    checker: invoiceParityChecker,
    itemProvider: new ParityItemProvider<InvoiceEntity>(),
    // afterCheckHook: async (file, v1Invoice, v2Invoice) => {
    //   await checkParityOnInvoiceTags(file, v1Invoice, v2Invoice);
    //   await checkParityOnDocuments(file, v1Invoice, v2Invoice);
    // },
    mapperFn: (item, em) =>
      buildCompleteInvoiceEntity(item, tagDefinitions[0], em),
    dependencies: {
      databaseService,
      repository: app.get(InvoiceRepository),
    },
  });
};

// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkParityOnInvoiceTags = async (
  file: string,
  v1Invoice: InvoiceEntity,
  v2Invoice: InvoiceEntity,
): Promise<void> => {
  const v1InvoiceTags = v1Invoice.tags
    .getItems()
    .map((item) => item.tagDefinition);
  const v2InvoiceTags = v2Invoice.tags
    .getItems()
    .map((item) => item.tagDefinition);

  for (const v1Tag of v1InvoiceTags) {
    const foundV2Tag = v2InvoiceTags.find((v2Tag) => v1Tag.key === v2Tag.key);
    if (foundV2Tag) {
      tagParityChecker.checkEquality(v1Tag, foundV2Tag);
    } else {
      tagParityChecker.report.addMissing(file, v1Tag);
    }
  }
};

// @ts-expect-error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkParityOnDocuments = async (
  file: string,
  v1Invoice: InvoiceEntity,
  v2Invoice: InvoiceEntity,
): Promise<void> => {
  const v2Documents = await v2Invoice.documents.loadItems();
  for (const v1Document of v1Invoice.documents) {
    const foundDocument =
      v2Documents.find((v2Document) => v1Document.id === v2Document.id) ?? null;
    if (foundDocument) {
      documentParityChecker.checkEquality(v1Document, foundDocument);
    } else {
      documentParityChecker.report.addMissing(file, v1Document);
    }
  }
};
