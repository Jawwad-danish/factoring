import { DataMapperUtil, loadNumberCleanup } from '@common';
import * as formulas from '@core/formulas';
import { percentOf } from '@core/formulas';
import { DataMapper } from '@core/mapping';
import { Arrays } from '@core/util';
import { UUID } from '@core/uuid';
import {
  CreateInvoiceRequest,
  Invoice,
  InvoiceBuyout,
  Reserve,
} from '@fs-bobtail/factoring/data';
import { BrokerPaymentMapper } from '@module-broker-payments/data';
import { UserMapper } from '@module-common';
import {
  BrokerPaymentStatus,
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  RecordStatus,
  TagDefinitionVisibility,
} from '@module-persistence/entities';
import {
  ClientFactoringConfigsRepository,
  InvoiceRepository,
  PendingBuyoutRepository,
} from '@module-persistence/repositories';
import { ReserveMapper } from '@module-reserves/data';
import { TagDefinitionMapper } from '@module-tag-definitions/data';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import { InvoiceContext } from '../invoice-context';
import { ActivityLogMapper } from './activity-log.mapper';
import { Hasher } from './hasher';
import { InvoiceDocumentMapper } from './invoice-document.mapper';

@Injectable()
export class InvoiceMapper implements DataMapper<InvoiceEntity, Invoice> {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly documentsMapper: InvoiceDocumentMapper,
    private readonly reservesMapper: ReserveMapper,
    private readonly activityLogMapper: ActivityLogMapper,
    private readonly brokerPaymentMapper: BrokerPaymentMapper,
    private readonly tagDefinitionMapper: TagDefinitionMapper,
    private readonly clientFactoringConfigRepository: ClientFactoringConfigsRepository,
    private readonly pendingBuyoutRepository: PendingBuyoutRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async entityToModel(entity: InvoiceEntity): Promise<Invoice> {
    const invoice = new Invoice();
    invoice.id = entity.id;
    invoice.clientId = entity.clientId;
    invoice.brokerId = entity.brokerId;
    invoice.displayId = entity.displayId;
    invoice.loadNumber = entity.loadNumber;
    invoice.advance = entity.advance;
    invoice.approvedFactorFee = entity.approvedFactorFee;
    invoice.approvedFactorFeePercentage = entity.approvedFactorFeePercentage;
    invoice.reserveFee = entity.reserveFee;
    invoice.reserveRatePercentage = entity.reserveRatePercentage;
    invoice.accountsReceivableValue = entity.accountsReceivableValue;
    invoice.detention = entity.detention;
    invoice.status = entity.status;
    invoice.verificationStatus = entity.verificationStatus;
    invoice.createdAt = entity.createdAt;
    invoice.updatedAt = entity.updatedAt;
    invoice.createdBy = await this.userMapper.createdByToModel(entity);
    invoice.updatedBy = await this.userMapper.updatedByToModel(entity);
    invoice.lumper = entity.lumper;
    invoice.note = entity.note || null;
    invoice.memo = entity.memo;
    invoice.clientPaymentStatus = entity.clientPaymentStatus;
    invoice.brokerPaymentStatus = entity.brokerPaymentStatus;
    invoice.value = entity.value;
    invoice.expedited = entity.expedited;
    invoice.lineHaulRate = entity.lineHaulRate;
    invoice.deduction = entity.deduction;
    invoice.rejectedDate = entity.rejectedDate || undefined;
    invoice.purchasedDate = entity.purchasedDate || undefined;
    invoice.paymentDate = entity.paymentDate || undefined;
    if (
      entity.invoiceClientPayments.isInitialized() &&
      entity.invoiceClientPayments.length > 0
    ) {
      const invoiceClientPayments = entity.invoiceClientPayments;
      invoice.clientPaymentTransferFee = invoiceClientPayments.reduce(
        (sum, invoiceClientPayment) =>
          sum.plus(invoiceClientPayment.clientPayment.transferFee || 0),
        new Big(0),
      );
      const firstClientPayment = invoiceClientPayments[0];
      invoice.clientPaymentBankAccountLastDigits =
        firstClientPayment.clientPayment.bankAccountLastDigits;
      invoice.clientPaymentTransferDate =
        firstClientPayment.clientPayment.createdAt;
    }
    if (entity.reserves.isInitialized()) {
      invoice.reserves = (
        await Arrays.mapAsync(
          entity.reserves.filter(
            (invoiceReserve) =>
              invoiceReserve.recordStatus === RecordStatus.Active,
          ),
          async (invoiceReserveEntity) => {
            if (invoiceReserveEntity.reserve) {
              const reserve = await this.reservesMapper.entityToModel(
                invoiceReserveEntity.reserve,
              );
              return reserve;
            }
            return null;
          },
        )
      ).filter((reserve) => reserve !== null) as Reserve[];
    }
    if (entity.documents.isInitialized()) {
      invoice.documents = (
        await DataMapperUtil.asyncMapCollections(
          entity.documents,
          this.documentsMapper,
        )
      ).filter((document) => document.recordStatus === RecordStatus.Active);
    }
    await this.maybeAssignBrokerPayments(entity, invoice);
    await this.maybeAssignActivities(entity, invoice);
    await this.maybeAssignTags(entity, invoice);
    if (entity.activities.isInitialized() && entity.tags.isInitialized()) {
      this.activityLogMapper.addExtraFieldsModel(
        invoice.activities,
        invoice.tags,
      );
    }

    if (entity.buyout) {
      invoice.buyout = new InvoiceBuyout();
      invoice.buyout.id = entity.buyout.id;
      invoice.buyout.paymentDate = entity.buyout.paymentDate;
      invoice.buyout.rate = entity.buyout.rate;
      invoice.buyout.createdAt = entity.buyout.createdAt;
      invoice.buyout.updatedAt = entity.buyout.updatedAt;
      invoice.buyout.createdBy = await this.userMapper.createdByToModel(entity);
      invoice.buyout.updatedBy = await this.userMapper.updatedByToModel(entity);
    }

    return invoice;
  }

  private async maybeAssignBrokerPayments(
    entity: InvoiceEntity,
    invoice: Invoice,
  ) {
    if (!entity.brokerPayments.isInitialized()) {
      return;
    }
    invoice.brokerPayments = await DataMapperUtil.asyncMapCollections(
      entity.brokerPayments,
      this.brokerPaymentMapper,
      { onlyActive: true },
    );
  }

  private async maybeAssignActivities(entity: InvoiceEntity, invoice: Invoice) {
    if (!entity.activities.isInitialized()) {
      return;
    }
    invoice.activities = (
      await DataMapperUtil.asyncMapCollections(
        entity.activities.filter(
          (activity) =>
            activity.recordStatus === RecordStatus.Active &&
            activity.tagDefinition.recordStatus === RecordStatus.Active &&
            activity.tagDefinition.visibility !==
              TagDefinitionVisibility.Internal,
        ),
        (e) => this.activityLogMapper.entityToModel(e),
      )
    ).sort((e1, e2) => e2.createdAt.getTime() - e1.createdAt.getTime());
  }

  private async maybeAssignTags(entity: InvoiceEntity, invoice: Invoice) {
    if (!entity.tags.isInitialized()) {
      return;
    }
    invoice.tags = await Arrays.mapAsync(
      entity.tags.filter(
        (invoiceTag) =>
          invoiceTag.recordStatus === RecordStatus.Active &&
          invoiceTag.tagDefinition.recordStatus === RecordStatus.Active &&
          invoiceTag.tagDefinition.visibility !==
            TagDefinitionVisibility.Internal,
      ),
      async (invoiceTagEntity) => {
        const tag = await this.tagDefinitionMapper.entityToModel(
          invoiceTagEntity.tagDefinition,
        );
        tag.assignedByType = invoiceTagEntity.assignedByType;
        return tag;
      },
    );
  }

  async createRequestToEntity(
    request: CreateInvoiceRequest,
  ): Promise<InvoiceEntity> {
    const entity = new InvoiceEntity();
    const client = await this.clientFactoringConfigRepository.getOneByClientId(
      request.clientId,
    );
    entity.id = request.id ?? UUID.get();
    const invoiceValue = formulas.totalAmount(request);
    entity.clientId = request.clientId;
    entity.brokerId = request.brokerId ?? null;
    entity.displayId = request.displayId;
    entity.loadNumber = loadNumberCleanup(request.loadNumber);
    entity.lineHaulRate = request.lineHaulRate;
    entity.lumper = request.lumper;
    entity.advance = request.advance;
    entity.detention = request.detention;
    entity.accountsReceivableValue = Big(0);
    entity.approvedFactorFee = Big(0);
    entity.approvedFactorFeePercentage = Big(0);
    entity.reserveFee = percentOf(invoiceValue, client.reserveRatePercentage);
    entity.reserveRatePercentage = client.reserveRatePercentage;
    entity.deduction = Big(0);
    entity.expedited = client?.expediteTransferOnly || request.expedited;
    entity.clientPaymentStatus = ClientPaymentStatus.NotApplicable;
    entity.brokerPaymentStatus = BrokerPaymentStatus.NotReceived;
    entity.note = request.note || null;
    entity.memo = request.memo;
    entity.value = invoiceValue;
    entity.status = InvoiceStatus.UnderReview;
    entity.documents.add(
      await Arrays.mapAsync(request.documents || [], (item) =>
        this.documentsMapper.createRequestToEntity(item),
      ),
    );
    await Hasher.apply(entity);
    if (request.id) {
      entity.id = request.id;
    }
    if (request.buyoutId) {
      const buyout = await this.pendingBuyoutRepository.getOneById(
        request.buyoutId,
      );
      entity.buyout = buyout;
      entity.accountsReceivableValue = invoiceValue;
      entity.purchasedDate = new Date();
      entity.status = InvoiceStatus.Purchased;
      entity.clientPaymentStatus = ClientPaymentStatus.Completed;
    }
    return entity;
  }

  async contextToModel(context: InvoiceContext): Promise<Invoice> {
    const invoice = await this.entityToModel(context.entity);
    invoice.client = context.client;
    if (context.broker) {
      invoice.broker = context.broker;
    }
    if (invoice.brokerId) {
      const approvedLoads =
        await this.invoiceRepository.findLast3ApprovedInvoicesByBroker(
          invoice.brokerId,
        );
      if (approvedLoads && approvedLoads.length > 0) {
        invoice.approvedLoads = approvedLoads;
      }
    }
    return invoice;
  }
}
