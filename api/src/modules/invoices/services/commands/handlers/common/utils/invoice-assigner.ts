import * as formulas from '@core/formulas';
import { hashFile } from '@core/services';
import Big from 'big.js';

import {
  InvoiceDocumentMapper,
  UpdateInvoiceRequest,
} from '@module-invoices/data';

import {
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  RecordStatus,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';

import {
  ActivityLogPayloadBuilder,
  ChangeActions,
  loadNumberCleanup,
} from '@common';
import { Assignment, AssignmentResult, Note } from '@core/data';
import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { Arrays } from '@core/util';
import { BrokerService } from '@module-brokers';
import { Injectable, Logger } from '@nestjs/common';
import { TagResolutionService } from '../../../../tag-resolution.service';
import { buildResolvedTagsNote } from '../../../../../utils';

export type UpdateInvoiceModel = UpdateInvoiceRequest & {
  status?: InvoiceStatus;
  verificationStatus?: VerificationStatus;
  deduction?: Big;
  accountsReceivableValue?: Big;
  rejectedDate?: Date;
  purchasedDate?: Date | null;
  clientPaymentStatus?: ClientPaymentStatus;
  reserveFee?: Big;
  reserveRatePercentage?: Big;
  approvedFactorFee?: Big;
  approvedFactorFeePercentage?: Big;
};

/**
 * Helper class that updates an invoice entity and creates an activity log for those changes
 */
@Injectable()
export class InvoiceAssigner {
  private logger: Logger = new Logger(InvoiceAssigner.name);

  constructor(
    private invoiceDocumentsMapper: InvoiceDocumentMapper,
    private brokerService: BrokerService,
    private readonly tagResolutionService: TagResolutionService,
  ) {}

  async apply(
    invoice: InvoiceEntity,
    updateInvoice: UpdateInvoiceModel,
    withTag:
      | TagDefinitionKey.UPDATE_INVOICE
      | TagDefinitionKey.REJECT_INVOICE
      | TagDefinitionKey.REVERT_INVOICE
      | TagDefinitionKey.PURCHASE_INVOICE = TagDefinitionKey.UPDATE_INVOICE,
  ): Promise<ChangeActions> {
    this.logger.log(`[Invoice ${invoice.id}] Applying changes`);
    const updateValuesResult = await this.generateUpdateAssignmentResult(
      invoice,
      updateInvoice,
    );
    const flagsResolvedText = await this.assignFlagsResolved(invoice);

    const updateChangeActions = ChangeActions.addActivity(
      withTag,
      Note.from({
        payload: ActivityLogPayloadBuilder.forKey(withTag, {
          data: updateValuesResult.getPayload(),
        }),
        text: updateValuesResult.getNote() + flagsResolvedText,
      }),
    );

    const addDocumentsResult = await this.addDocuments(invoice, updateInvoice);
    const updateDocumentsResult = await this.updateDocuments(
      invoice,
      updateInvoice,
    );
    const deleteDocumentsResult = await this.deleteDocuments(
      invoice,
      updateInvoice,
    );

    return updateChangeActions
      .concat(addDocumentsResult)
      .concat(deleteDocumentsResult)
      .concat(updateDocumentsResult);
  }

  private async addDocuments(
    invoice: InvoiceEntity,
    updateInvoice: UpdateInvoiceModel,
  ): Promise<ChangeActions> {
    if (
      !updateInvoice.documents ||
      (updateInvoice.documents?.toAdd || []).length === 0
    ) {
      return ChangeActions.empty();
    }

    this.logger.log(`[Invoice ${invoice.id}] Adding documents`);
    const documents = await Arrays.mapAsync(
      updateInvoice.documents?.toAdd || [],
      (document) => this.invoiceDocumentsMapper.createRequestToEntity(document),
    );

    for (const document of documents) {
      const fileHash = await hashFile(document.internalUrl);
      if (fileHash) {
        document.fileHash = fileHash;
      }
    }

    documents.forEach((e) => invoice.documents.add(e));
    return ChangeActions.addActivity(
      TagDefinitionKey.DOCUMENTS_ADD,
      Note.fromPayload(
        ActivityLogPayloadBuilder.forKey(TagDefinitionKey.DOCUMENTS_ADD, {
          placeholders: {
            names: documents.map((document) => document.name).join(','),
          },
          data: {
            documents: documents.map((document) => document.name),
          },
        }),
      ),
    );
  }

  private async updateDocuments(
    invoice: InvoiceEntity,
    updateInvoice: UpdateInvoiceModel,
  ): Promise<any> {
    if (
      !updateInvoice.documents ||
      (updateInvoice.documents?.toUpdate || []).length === 0
    ) {
      return ChangeActions.empty();
    }

    this.logger.log(`[Invoice ${invoice.id}] updating documents`);
    const documents = invoice.documents.getItems().filter((document) => {
      const toUpdateDocument = updateInvoice.documents?.toUpdate.find(
        (reqDocument) => reqDocument.id === document.id,
      );
      if (toUpdateDocument?.label) {
        document.label = toUpdateDocument.label;
        return true;
      }
      return false;
    });

    return ChangeActions.addActivity(
      TagDefinitionKey.DOCUMENTS_UPDATE,
      Note.fromPayload(
        ActivityLogPayloadBuilder.forKey(TagDefinitionKey.DOCUMENTS_UPDATE, {
          placeholders: {
            names: documents.map((document) => document.name).join(','),
          },
          data: {
            documents: documents.map((document) => document.label),
          },
        }),
      ),
    );
  }

  private async deleteDocuments(
    invoiceEntity: InvoiceEntity,
    updateInvoice: UpdateInvoiceModel,
  ): Promise<ChangeActions> {
    if ((updateInvoice.documents?.toDelete || []).length === 0) {
      return ChangeActions.empty();
    }

    this.logger.log(`[Invoice ${invoiceEntity.id}] Removing documents`);
    const documents = invoiceEntity.documents
      .getItems()
      .filter((e) => updateInvoice.documents?.toDelete.includes(e.id));
    documents.forEach(
      (document) => (document.recordStatus = RecordStatus.Inactive),
    );

    return ChangeActions.addActivity(
      TagDefinitionKey.DOCUMENTS_DELETE,
      Note.fromPayload(
        ActivityLogPayloadBuilder.forKey(TagDefinitionKey.DOCUMENTS_DELETE, {
          placeholders: {
            names: documents.map((document) => document.name).join(','),
          },
          data: {
            documents: documents.map((document) => document.name),
          },
        }),
      ),
    );
  }

  private async generateUpdateAssignmentResult(
    entity: InvoiceEntity,
    payload: UpdateInvoiceModel,
  ): Promise<AssignmentResult> {
    const amountsAssignmentResult = this.assignAmounts(entity, payload);
    const detailsAssignmentResult = await this.assignDetails(entity, payload);
    const assignmentResult = amountsAssignmentResult.concat(
      detailsAssignmentResult,
    );

    return assignmentResult;
  }

  private assignAmounts(
    entity: InvoiceEntity,
    payload: UpdateInvoiceModel,
  ): AssignmentResult {
    let result = AssignmentResult.merge([
      Assignment.assign(entity, 'lumper', payload.lumper, {
        note: {
          valueMapper: (value) => formatToDollars(penniesToDollars(value)),
        },
        valueMapper: Assignment.changeSetMappers.big,
        predicate: Assignment.predicates.big,
      }),
      Assignment.assign(entity, 'advance', payload.advance, {
        note: {
          valueMapper: (value) => formatToDollars(penniesToDollars(value)),
        },
        valueMapper: Assignment.changeSetMappers.big,
        predicate: Assignment.predicates.big,
      }),
      Assignment.assign(entity, 'lineHaulRate', payload.lineHaulRate, {
        note: {
          name: 'line haul rate',
          valueMapper: (value) => formatToDollars(penniesToDollars(value)),
        },
        valueMapper: Assignment.changeSetMappers.big,
        predicate: Assignment.predicates.big,
      }),
      Assignment.assign(entity, 'detention', payload.detention, {
        note: {
          valueMapper: (value) => formatToDollars(penniesToDollars(value)),
        },
        valueMapper: Assignment.changeSetMappers.big,
        predicate: Assignment.predicates.big,
      }),
      Assignment.assign(entity, 'deduction', payload.deduction, {
        note: {
          valueMapper: (value) => formatToDollars(penniesToDollars(value)),
        },
        valueMapper: Assignment.changeSetMappers.big,
        predicate: Assignment.predicates.big,
      }),
      Assignment.assign(entity, 'reserveFee', payload.reserveFee, {
        note: {
          valueMapper: (value) => formatToDollars(penniesToDollars(value)),
        },
        valueMapper: Assignment.changeSetMappers.big,
        predicate: Assignment.predicates.big,
      }),
      Assignment.assign(
        entity,
        'reserveRatePercentage',
        payload.reserveRatePercentage,
        {
          note: {
            valueMapper: (value) => formatToDollars(penniesToDollars(value)),
          },
          valueMapper: Assignment.changeSetMappers.big,
          predicate: Assignment.predicates.big,
        },
      ),
      Assignment.assign(
        entity,
        'approvedFactorFee',
        payload.approvedFactorFee,
        {
          note: {
            valueMapper: (value) => formatToDollars(penniesToDollars(value)),
          },
          valueMapper: Assignment.changeSetMappers.big,
          predicate: Assignment.predicates.big,
        },
      ),
      Assignment.assign(
        entity,
        'approvedFactorFeePercentage',
        payload.approvedFactorFeePercentage,
        {
          note: {
            valueMapper: (value) => formatToDollars(penniesToDollars(value)),
          },
          valueMapper: Assignment.changeSetMappers.big,
          predicate: Assignment.predicates.big,
        },
      ),
      Assignment.assign(
        entity,
        'accountsReceivableValue',
        payload.accountsReceivableValue,
        {
          note: {
            name: 'accounts receivable',
            valueMapper: (value) => formatToDollars(penniesToDollars(value)),
          },
          valueMapper: Assignment.changeSetMappers.big,
          predicate: Assignment.predicates.big,
        },
      ),
    ]);

    if (result.hasChanges()) {
      const totalAmount = formulas.totalAmount(entity);
      const valueAssignmentResult = Assignment.assign(
        entity,
        'value',
        totalAmount,
        {
          note: {
            name: 'total amount',
            valueMapper: (value) => formatToDollars(penniesToDollars(value)),
          },
          valueMapper: Assignment.changeSetMappers.big,
          predicate: Assignment.predicates.big,
        },
      );
      result = result.concat(valueAssignmentResult);
    }
    return result;
  }

  private async assignFlagsResolved(entity: InvoiceEntity): Promise<string> {
    const changedActions = await this.tagResolutionService.run(entity);
    return buildResolvedTagsNote(changedActions);
  }

  private async assignDetails(
    entity: InvoiceEntity,
    payload: UpdateInvoiceModel,
  ): Promise<AssignmentResult> {
    const cleanLoadNumber = payload.loadNumber
      ? loadNumberCleanup(payload.loadNumber)
      : undefined;
    const oldBrokerName = await this.getBrokerName(entity.brokerId);
    const newBrokerName = await this.getBrokerName(payload.brokerId);

    return AssignmentResult.merge([
      Assignment.assign(entity, 'loadNumber', cleanLoadNumber, {
        note: {
          name: 'load number',
        },
      }),
      Assignment.assign(entity, 'memo', payload.memo),
      Assignment.assign(entity, 'note', payload.note),
      Assignment.assign(entity, 'clientId', payload.clientId, {
        note: {
          name: 'client',
        },
      }),
      Assignment.assign(entity, 'brokerId', payload.brokerId, {
        note: {
          name: 'broker',
          valueMapper: (value) => {
            if (value === entity.brokerId) {
              return oldBrokerName;
            }
            return newBrokerName;
          },
        },
      }),
      Assignment.assign(entity, 'expedited', payload.expedited, {
        note: {
          name: 'expedited',
        },
      }),
      Assignment.assign(entity, 'status', payload.status, {
        note: {
          valueMapper: (value) => {
            switch (value) {
              case InvoiceStatus.Purchased:
                return 'Purchased';
              case InvoiceStatus.UnderReview:
                return 'Under Review';
              case InvoiceStatus.Rejected:
                return 'Rejected';
              default:
                return 'Unknown';
            }
          },
        },
      }),
      Assignment.assign(
        entity,
        'verificationStatus',
        payload.verificationStatus,
      ),
      Assignment.assign(entity, 'rejectedDate', payload.rejectedDate, {
        note: {
          name: 'rejected date',
        },
      }),
      Assignment.assign(entity, 'purchasedDate', payload.purchasedDate, {
        note: {
          name: 'purchased date',
        },
      }),
      Assignment.assign(
        entity,
        'clientPaymentStatus',
        payload.clientPaymentStatus,
        {
          note: {
            name: 'Client payment status',
          },
        },
      ),
    ]);
  }

  private async getBrokerName(
    brokerId: string | null | undefined,
  ): Promise<string> {
    if (brokerId === null) {
      return 'Broker Not Found';
    }
    if (brokerId) {
      return (await this.brokerService.getOneById(brokerId)).legalName;
    }
    return '';
  }
}
