import { S3ObjectLocator, S3Service } from '@module-aws';
import {
  ClientBatchPaymentRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import {
  ClientBatchPaymentContext,
  CreateClientBatchPaymentRequest,
} from '../../data';
import { ClientBatchPaymentMapper } from '../../mappers';
import { BaseClientBatchPaymentOperation } from '../common';
import { CreateClientBatchPaymentRuleService } from './rules';
import { CreateClientBatchPaymentValidationService } from './validation';

@Injectable()
export class CreateClientBatchPaymentOperation extends BaseClientBatchPaymentOperation<CreateClientBatchPaymentRequest> {
  constructor(
    clientBatchPaymentRepository: ClientBatchPaymentRepository,
    mapper: ClientBatchPaymentMapper,
    validationService: CreateClientBatchPaymentValidationService,
    ruleService: CreateClientBatchPaymentRuleService,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly s3Service: S3Service,
  ) {
    super(clientBatchPaymentRepository, mapper, validationService, ruleService);
  }
  async createContext(
    payload: CreateClientBatchPaymentRequest,
  ): Promise<ClientBatchPaymentContext<CreateClientBatchPaymentRequest>> {
    const data = (await this.getS3JSONContent(
      payload.bucketName,
      payload.s3FileKey,
    )) as Record<string, any>;

    const invoiceIds = this.getInvoiceIds(data.payload);
    const entity = await this.mapper.mapS3DataToClientBatchPaymentEntity(
      data.payload,
    );
    const invoiceList = await this.invoiceRepository.findByIds(invoiceIds);
    const existingEntity = await this.clientBatchPaymentRepository.findOneById(
      data.payload.id,
    );

    return {
      payload,
      entity,
      data: data.payload,
      invoiceList,
      paymentExists: existingEntity !== null,
    };
  }

  private async getS3JSONContent(bucketName: string, s3FileKey: string) {
    const s3Locator = new S3ObjectLocator(bucketName, s3FileKey);

    const readableContent = await this.s3Service.getObjectContent(s3Locator);
    return JSON.parse(readableContent);
  }

  private getInvoiceIds(data: Record<string, any>): string[] {
    const invoiceIds: string[] = [];
    data.client_payments?.forEach((payment) =>
      payment.client_account_payment_attributions?.forEach((attr) => {
        if (attr?.invoice_id) {
          invoiceIds.push(attr.invoice_id);
        }
      }),
    );
    return invoiceIds;
  }
}
