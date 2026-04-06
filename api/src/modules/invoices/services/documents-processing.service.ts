import { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { AppContextHolder } from '@core/app-context';
import { buildMessageAttributes, SQSService } from '@module-aws';
import { FeatureFlag, FeatureFlagResolver } from '@module-common';
import { Config, CONFIG_SERVICE, ConfigService } from '@module-config';
import {
  InvoiceContext,
  InvoiceDocumentMapper,
  InvoiceMapper,
} from '@module-invoices/data';
import { InvoiceDocumentType } from '@module-persistence';
import { Inject, Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { LambdaInvoice } from '../../../lambda/types';

export const INVOICE_DOCUMENTS_QUEUE_URL_KEY = 'INVOICE_DOCUMENTS_QUEUE_URL';
@Injectable()
export class DocumentsProcessor {
  private logger: Logger = new Logger(DocumentsProcessor.name);
  private processingQueueUrl: string;

  constructor(
    @Inject(CONFIG_SERVICE) private configService: ConfigService,
    private sqsService: SQSService,
    private readonly featureFlagResolver: FeatureFlagResolver,
    private readonly invoiceMapper: InvoiceMapper,
    private readonly invoiceDocumentMapper: InvoiceDocumentMapper,
  ) {
    this.configService
      .observeValue(INVOICE_DOCUMENTS_QUEUE_URL_KEY)
      .subscribe((config) => this.onQueueUrlChange(config));
  }

  private async onQueueUrlChange(config: Config) {
    this.processingQueueUrl = config.asString();
    this.logger.log(`Queue Url has changed ${this.processingQueueUrl}`);
  }

  async sendToProcess(
    context: InvoiceContext,
    sendDocumentAfterProcessingFlag = false,
  ) {
    const invoice = await this.invoiceMapper.contextToModel(context);
    if (
      !this.featureFlagResolver.isEnabled(FeatureFlag.EnableDocumentProcessing)
    ) {
      return;
    }
    this.logger.log(
      `Sending ${invoice.documents.length} documents to process for invoice ${invoice.id} `,
    );
    const uploadedDocuments = invoice.documents.filter(
      (doc) => doc.type === InvoiceDocumentType.Uploaded,
    );
    invoice.documents = uploadedDocuments;
    const messageBody: LambdaInvoice = {
      id: invoice.id,
      loadNumber: invoice.loadNumber,
      displayId: invoice.displayId,
      note: invoice.note || '',
      broker: invoice.broker
        ? {
            doingBusinessAs: invoice.broker.doingBusinessAs,
            addresses: invoice.broker.addresses,
            mc: invoice.broker.mc,
            dot: invoice.broker.dot,
            legalName: invoice.broker.legalName,
          }
        : null,
      documents: await this.invoiceDocumentMapper.mapDocumentsForProcessing(
        invoice.documents,
      ),
      lumper: invoice.lumper.div(100).toNumber(),
      detention: invoice.detention.div(100).toNumber(),
      lineHaulRate: invoice.lineHaulRate.div(100).toNumber(),
      advance: invoice.advance.div(100).toNumber(),
      totalAmount: invoice.totalAmount().div(100).toNumber(),
      createdAt: dayjs(invoice.createdAt).format('MMMM D, YYYY'),
      sendDocumentAfterProcessingFlag: sendDocumentAfterProcessingFlag,
    };

    if (invoice.client) {
      messageBody.client = {
        mc: invoice.client.mc,
        dot: invoice.client.dot,
        name: invoice.client.name,
        doingBusinessAs: invoice.client.doingBusinessAs,
      };
    }

    const headers = {};
    const appContext = AppContextHolder.get();
    headers['authorizationToken'] = appContext.accessToken;
    const messageOptions: Partial<SendMessageCommandInput> = {
      MessageGroupId: invoice.id,
      MessageAttributes: buildMessageAttributes(headers),
    };

    const response = await this.sqsService.sendMessage(
      this.processingQueueUrl,
      JSON.stringify(messageBody),
      messageOptions,
    );
    this.logger.log(
      `Invoice documents sent successfully to queue ${this.processingQueueUrl} to be processed for invoice id ${invoice.id}. Message Id ${response.MessageId}`,
    );
  }
}
