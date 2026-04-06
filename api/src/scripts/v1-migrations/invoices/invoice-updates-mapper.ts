import { ActivityLogPayloadBuilder } from '@common';
import { formatToDollars, monthDayYear } from '@core/formatting';
import { dollarsToPennies } from '@core/formulas';
import { EntityManager } from '@mikro-orm/core';
import {
  ActivityLogEntity,
  BrokerPaymentType,
  InvoiceStatus,
  TagDefinitionEntity,
  TagDefinitionKey,
  TagStatus,
  VerificationStatus,
} from '@module-persistence/entities';
import Big from 'big.js';
import { isNumber } from 'lodash';
import { referenceUserData } from 'src/scripts/util';
import { allInvoiceStatuses } from '../constants';
import { getTagDefinitionFromFlag } from './invoice-tags-mapper';
import { mapStatus } from './util';

type ActivityLogSupplier = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
) => null | ActivityLogEntity;

const getTagDefinition = (
  tagDefinitions: TagDefinitionEntity[],
  key: TagDefinitionKey,
): TagDefinitionEntity => {
  const found = tagDefinitions.find(
    (tagDefinition) => tagDefinition.key === key,
  );
  if (!found) {
    throw new Error(`Could not find tag definition ${key}`);
  }
  return found;
};

const buildActivityLogEntity = (
  invoiceUpdate: any,
  tagDefinition: TagDefinitionEntity,
  payload: object = {},
): ActivityLogEntity => {
  const entity = new ActivityLogEntity();
  entity.id = invoiceUpdate.id;
  entity.tagDefinition = tagDefinition;
  entity.payload = payload;
  entity.note = invoiceUpdate.notes || '';
  entity.createdAt = new Date(invoiceUpdate.created_at);
  return entity;
};

const buildClientPaidActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const notes = invoiceUpdate.notes;
  const paidAmount = new Big(
    notes
      .substring(notes.indexOf('$') + 1, notes.indexOf(' as'))
      .replace(',', ''),
  );
  const batchAmount = new Big(
    notes
      .substring(notes.lastIndexOf('of ') + 4, notes.indexOf(' batch'))
      .replace(',', ''),
  );
  const accountLastDigits = notes.substring(
    notes.indexOf('*') + 1,
    notes.lastIndexOf('.'),
  );
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.PAID_TO_CLIENT),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.PAID_TO_CLIENT, {
      data: {
        paidAmount: dollarsToPennies(paidAmount).toNumber(),
        batchAmount: dollarsToPennies(batchAmount).toNumber(),
        accountLastDigits: accountLastDigits,
      },
    }),
  );
};

const buildCreatedActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const firstIndex = invoiceUpdate.notes.indexOf('$');
  const lastIndex = invoiceUpdate.notes.indexOf(' to');
  const stringAmount = invoiceUpdate.notes.substring(firstIndex + 1, lastIndex);
  const amount = isNumber(stringAmount) ? Big(stringAmount) : Big(0);
  const broker = invoiceUpdate.notes.substring(lastIndex + 4);
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.CREATE_INVOICE),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.CREATE_INVOICE, {
      placeholders: {
        client: invoice.client.name,
        broker: broker,
        amount: formatToDollars(amount),
      },
      data: {
        client: invoice.client.name,
        broker: broker,
        amount: dollarsToPennies(amount).toNumber(),
      },
    }),
  );
};

const buildApprovedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.PURCHASE_INVOICE),
  );
};

const buildFiledOnBondActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.FILED_ON_BROKER_BOND),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.FILED_ON_BROKER_BOND, {
      data: {
        talk: {
          to: invoiceUpdate.talked_to,
          contactMethod: invoiceUpdate.talked_to_contact_method,
        },
        invoice: {
          status: InvoiceStatus.Purchased,
        },
      },
    }),
  );
};

const buildBrokerClaimActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const found = invoice.broker_payment?.find((payment) => payment.amount === 0);
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
      {
        data: {
          brokerPaymentId: found?.id || null,
          invoice: {
            status: mapStatus(invoice),
          },
        },
      },
    ),
  );
};

const buildRateIncorrectActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.INCORRECT_RATE_ADDED),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.INCORRECT_RATE_ADDED, {
      data: {
        lineHaulRate: parseInt(invoice.line_haul_rate),
        invoice: {
          status: mapStatus(invoice),
        },
      },
    }),
  );
};

const buildBrokerPaidPreviousFactorActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_PAID_PREVIOUS_FACTOR,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_PAID_PREVIOUS_FACTOR,
      {
        data: {
          invoice: {
            status: mapStatus(invoice),
          },
        },
      },
    ),
  );
};

const buildCancelledLoadActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_CANCELLED_LOAD),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.BROKER_CANCELLED_LOAD, {
      data: {
        cancellationDate: new Date(
          invoiceUpdate.metadata.date || null,
        ).toISOString(),
        invoice: {
          status: mapStatus(invoice),
        },
      },
    }),
  );
};

const buildPossibleDuplicateActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.POSSIBLE_DUPLICATE_INVOICE,
      {
        placeholders: {
          loadNumber: invoice.load_number,
          possibleDuplicates: (
            invoiceUpdate.metadata.possible_duplicates || []
          ).map((possibleDuplicate) => possibleDuplicate.load_number),
        },
        data: {
          invoice: {
            id: invoice.id,
            loadNumber: invoice.load_number,
          },
          duplicates: (invoiceUpdate.metadata.possible_duplicates || []).map(
            (possibleDuplicate: any) => {
              return {
                id: possibleDuplicate.id,
                loadNumber: possibleDuplicate.load_number,
              };
            },
          ),
        },
      },
    ),
  );
};

const buildLowCreditActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.LOW_BROKER_CREDIT_RATING),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.LOW_BROKER_CREDIT_RATING,
      {
        placeholders: {
          broker: invoice.debtor.name,
          rating: invoice.debtor.rating,
        },
        data: {
          broker: {
            id: invoice.debtor_id,
            name: invoice.debtor.name,
            rating: invoice.debtor.rating,
          },
          invoice: {
            status: mapStatus(invoice),
          },
        },
      },
    ),
  );
};

const buildInvoiceReturnedToPendingFromApproved = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.REVERT_INVOICE),
  );
};

const buildFlagNotificationActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const notes = invoiceUpdate.notes;
  const phone = notes.substring(
    notes.indexOf('to ') + 3,
    notes.indexOf(' and'),
  );
  const email = notes.substring(notes.lastIndexOf('to ') + 3);
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.NOTIFICATION),
    {
      phone,
      email,
    },
  );
};

const buildNoteActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.NOTE),
  );
};

const buildProcessingActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.PROCESSING),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.PROCESSING, {
      data: {
        contactPerson: invoiceUpdate.talked_to || '',
        contactType: invoiceUpdate.talked_to_contact_method || '',
        invoiceStatus: mapStatus(invoiceUpdate.update_type),
      },
    }),
  );
};

const buildMissingDocumentActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.MISSING_DOCUMENT),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.MISSING_DOCUMENT, {
      data: {
        missing: invoiceUpdate.missing || '',
        contactPerson: invoiceUpdate.talked_to || '',
        contactType: invoiceUpdate.talked_to_contact_method || '',
        invoiceStatus: mapStatus(invoiceUpdate.update_type),
      },
    }),
  );
};

const buildBrokerPaymentScheduledActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_PAYMENT_SCHEDULED),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_PAYMENT_SCHEDULED,
      {
        data: {
          checkNumberOrACH: invoiceUpdate.check_number_or_ach || '',
          contactPerson: invoiceUpdate.talked_to || '',
          contactType: invoiceUpdate.talked_to_contact_method || '',
          invoiceStatus: mapStatus(invoiceUpdate.update_type),
          paymentIssueDate: invoiceUpdate['issue date'] || '',
        },
      },
    ),
  );
};

const buildOtherActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.OTHER_INVOICE_ISSUE),
  );
};

const buildAdvanceTakenActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.ADVANCE_TAKEN),
  );
};

const buildWaitOnVerificationActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  let payload = {};
  const { talked_to, talked_to_contact_method } = invoiceUpdate;
  if (talked_to && talked_to_contact_method) {
    payload = ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.VERIFY_INVOICE,
      {
        data: {
          contactPerson: talked_to,
          contactType: talked_to_contact_method,
          status: VerificationStatus.InProgress,
        },
      },
    );
  }
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.WAITING_FOR_BROKER_VERIFICATION,
    ),
    payload,
  );
};

const buildBypassVerificationActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const { talked_to, talked_to_contact_method } = invoiceUpdate;
  const payload = ActivityLogPayloadBuilder.forKey(
    TagDefinitionKey.VERIFY_INVOICE,
    {
      data: {
        contactPerson: talked_to || 'Missing from import',
        contactType: talked_to_contact_method || 'Missing from import',
        status: VerificationStatus.Bypassed,
      },
    },
  );
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.VERIFY_INVOICE),
    payload,
  );
};

const buildInvoiceVerifiedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const { talked_to, talked_to_contact_method } = invoiceUpdate;
  const payload = ActivityLogPayloadBuilder.forKey(
    TagDefinitionKey.VERIFY_INVOICE,
    {
      data: {
        contactPerson: talked_to || 'Missing from import',
        contactType: talked_to_contact_method || 'Missing from import',
        status: VerificationStatus.Verified,
      },
    },
  );
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.VERIFY_INVOICE),
    payload,
  );
};

const buildInvoiceUpdateActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.UPDATE_INVOICE),
  );
};

const buildDeclinedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
) => {
  const foundTagDefinition = getTagDefinitionFromFlag(
    tagDefinitions,
    invoiceUpdate.update_status,
  );
  if (!foundTagDefinition) {
    return null;
  }
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.REJECT_INVOICE),
  );
};

const buildBrokerPaymentActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
  key:
    | TagDefinitionKey.BROKER_PAYMENT_OVERPAY
    | TagDefinitionKey.BROKER_PAYMENT_SHORTPAY
    | TagDefinitionKey.BROKER_PAYMENT_IN_FULL,
) => {
  const tagDefinition = getTagDefinition(tagDefinitions, key);
  const amount = new Big(invoiceUpdate.metadata.amount_paid || 0);
  const type: BrokerPaymentType = invoiceUpdate.notes.includes('ACH')
    ? BrokerPaymentType.Ach
    : BrokerPaymentType.Check;
  return buildActivityLogEntity(
    invoiceUpdate,
    tagDefinition,
    ActivityLogPayloadBuilder.forKey(key, {
      placeholders: {
        amount: formatToDollars(amount),
        type: type,
        batchDate: monthDayYear(invoiceUpdate.metadata.batch_date),
      },
      data: {
        amount: amount.toNumber(),
        type,
        batchDate: new Date(invoiceUpdate.metadata.batch_date),
        brokerPaymentId: invoiceUpdate.metadata.debtorPaymentId,
      },
    }),
  );
};

const buildBrokerNonPaymentActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
) => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_PAYMENT_NON_PAYMENT,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_PAYMENT_NON_FACTORED,
      {
        data: {
          amount: new Big(invoice.total_amount).toNumber(),
        },
      },
    ),
  );
};

const buildBrokerPaymentInFullActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildBrokerPaymentActivityLog(
    invoice,
    invoiceUpdate,
    tagDefinitions,
    TagDefinitionKey.BROKER_PAYMENT_IN_FULL,
  );
};

const buildBrokerPaymentRemovedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
) => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_PAYMENT_DELETE),
  );
};

const invoiceUpdateToActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): null | ActivityLogEntity => {
  const updateTypeMapper = invoiceUpdateTypeMappers[invoiceUpdate.update_type];
  if (updateTypeMapper && invoiceUpdate.update_type !== 'nonpayment') {
    return updateTypeMapper(invoice, invoiceUpdate, tagDefinitions);
  }

  const mappingFunction =
    invoiceUpdateStatusMappers[invoiceUpdate.update_status];
  let activity: null | ActivityLogEntity = null;
  const isFlag =
    allInvoiceStatuses[invoiceUpdate.update_type][invoiceUpdate.update_status]
      ?.flagged;
  const shouldCreateTag = !invoiceUpdate.allegedly_fixed;
  if (mappingFunction) {
    const activity = mappingFunction(invoice, invoiceUpdate, tagDefinitions);
    if (activity && isFlag && !shouldCreateTag) {
      activity.tagStatus = TagStatus.Inactive;
    }
    return activity;
  }
  if (activity === null && isFlag && !shouldCreateTag) {
    const foundTagDefinition = getTagDefinitionFromFlag(
      tagDefinitions,
      invoiceUpdate.update_status,
    );
    if (foundTagDefinition) {
      activity = new ActivityLogEntity();
      activity.id = invoiceUpdate.id;
      activity.tagDefinition = foundTagDefinition;
      activity.createdAt = new Date(invoiceUpdate.created_at);
      activity.tagStatus = TagStatus.Inactive;
      activity.payload = invoiceUpdate;
      activity.note = invoiceUpdate.notes || '';
    }
  }
  return activity;
};

export const mapInvoiceUpdates = (
  invoice: any,
  tagDefinitions: TagDefinitionEntity[],
  em: EntityManager,
): ActivityLogEntity[] => {
  return invoice.invoice_updates
    .map((invoiceUpdate: any) => {
      const entity = invoiceUpdateToActivityLog(
        invoice,
        invoiceUpdate,
        tagDefinitions,
      );
      if (entity !== null) {
        if (!invoiceUpdate.created_by) {
          invoiceUpdate.created_by = invoiceUpdate.updated_by;
        }
        referenceUserData(entity, invoiceUpdate, em);
      } else {
        console.error(`No mapping was done for invoice update`, {
          invoiceId: invoice.id,
          invoiceUpdateId: invoiceUpdate.id,
          invoiceUpdateStatus: invoiceUpdate.update_status,
          invoiceUpdateType: invoiceUpdate.update_type,
        });
      }
      return entity;
    })
    .filter((invoiceUpdate: null | ActivityLogEntity) => invoiceUpdate != null);
};

const buildMissingBOLActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.MISSING_BILL_OF_LADING),
  );
};

const buildMissingRateConActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.MISSING_RATE_CONFIRMATION,
    ),
  );
};

const buildMultipleRateConActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.MULTIPLE_RATE_CONFIRMATION_DOCUMENTS,
    ),
  );
};

const buildClientHasNegaticeReserveActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.CLIENT_HAS_NEGATIVE_RESERVES,
    ),
  );
};

const buildMailInvoiceOriginalActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.MAIL_INVOICE_ORIGINAL),
  );
};

const buildRateConfirmationBolMismatchActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.RATE_CONFIRMATION_BILL_OF_LADING_MISMATCH,
    ),
  );
};

const buildUnreadableDocumentActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.UNREADABLE_DOCUMENT),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.UNREADABLE_DOCUMENT, {
      data: {
        contactPerson: invoiceUpdate.talked_to || '',
        contactType: invoiceUpdate.talked_to_contact_method || '',
        invoiceStatus: mapStatus(invoiceUpdate.update_type),
      },
    }),
  );
};

const buildDuplicateInvoiceActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.DUPLICATE_INVOICE),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.DUPLICATE_INVOICE, {
      data: {
        invoiceStatus: mapStatus(invoiceUpdate.update_type),
      },
    }),
  );
};

const buildNoBrokerDeliveryOptionsActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_INFORMATION_MISSING,
    ),
  );
};

const buildBrokerNotFoundActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_NOT_FOUND),
  );
};

const buildBrokerClaimAgainstClientActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
    ),
  );
};

const buildShortpayReasonActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_PAYMENT_SHORTPAY),
  );
};

const buildBrokerUnresponsiveActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_UNRESPONSIVE),
  );
};

const buildMissingSignatureActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.MISSING_RECEIVER_SIGNATURE,
    ),
  );
};

const buildRequestedPaperworkNotSubmittedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.REQUESTED_PAPERWORK_NOT_SUBMITTED,
    ),
  );
};

const buildMailInvoiceCopyActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.MAIL_INVOICE_COPY),
  );
};

const buildMissingLumperReceiptActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.MISSING_LUMPER_RECEIPT),
  );
};

const buildEmailSendFailedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.EMAIL_SEND_FAILED),
  );
};

const buildEmailSendBlockedActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.INVOICE_EMAIL_BLOCKED),
  );
};

const buildIncorrectClientRateConActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.INCORRECT_CLIENT_ON_RATE_CONFIRMATION,
    ),
  );
};

const buildVerificationUnsuccessfulActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.VERIFICATION_UNSUCCESSFUL,
    ),
  );
};

const buildLoadNotDeliveredActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.LOAD_NOT_DELIVERED),
  );
};

const buildMissingScaleTicketActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.MISSING_SCALE_TICKET),
  );
};

const buildScannedCopyOfBOLRequiredActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.SCANNED_COPY_OF_BILL_OF_LADING_REQUIRED,
    ),
  );
};

const buildBrokerPaidClientDirectlyActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_PAID_CLIENT_DIRECTLY,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_PAID_CLIENT_DIRECTLY,
      {
        data: {
          checkNumberOrACH: invoiceUpdate.check_number_or_ach || '',
          contactPerson: invoiceUpdate.talked_to || '',
          contactType: invoiceUpdate.talked_to_contact_method || '',
          invoiceStatus: mapStatus(invoiceUpdate.update_type),
        },
      },
    ),
  );
};

const buildBrokerSentPaymentViaECheckActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_SENT_PAYMENT_VIA_E_CHECK,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_SENT_PAYMENT_VIA_E_CHECK,
      {
        data: {
          checkNumber: invoiceUpdate.metadata?.check_number || '',
          paidDate: invoiceUpdate.metaata?.date || '',
        },
      },
    ),
  );
};

const buildBrokerPaidToDifferentInvoiceActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_PAID_TO_DIFFERENT_INVOICE,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_PAID_TO_DIFFERENT_INVOICE,
      {
        data: {
          checkNumber: invoiceUpdate.metadata?.check_number || '',
          date: invoiceUpdate.metadata?.date || '',
          loadNumber: invoiceUpdate.metadata?.load_number || '',
        },
      },
    ),
  );
};

const buildDebtorClaimActivityLog = (
  invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  const found = invoice.broker_payment?.find((payment) => payment.amount === 0);
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
      {
        data: {
          brokerPaymentId: found?.id || null,
          contactPerson: invoiceUpdate.talked_to || '',
          contactType: invoiceUpdate.talked_to_contact_method || '',
          invoice: { status: mapStatus(invoiceUpdate.update_type) },
        },
      },
    ),
  );
};

const buildClientNeedsToContactBrokerActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.CLIENT_NEEDS_TO_CONTACT_BROKER,
    ),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.CLIENT_NEEDS_TO_CONTACT_BROKER,
      {
        data: {
          brokerContact: invoiceUpdate.metadata?.broker_contact || '',
          phoneNumber: invoiceUpdate.metadata?.phone_number || '',
          invoiceStatus: mapStatus(invoiceUpdate.update_type),
        },
      },
    ),
  );
};

const buildPossibleClaimOnLoadActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.POSSIBLE_CLAIM_ON_LOAD),
  );
};

const invoiceUpdateTypeMappers: Record<string, ActivityLogSupplier> = {
  declined: buildDeclinedActivityLog,
  shortpay: (invoice, invoiceUpdate, tagDefinitions) =>
    buildBrokerPaymentActivityLog(
      invoice,
      invoiceUpdate,
      tagDefinitions,
      TagDefinitionKey.BROKER_PAYMENT_SHORTPAY,
    ),
  overpay: (invoice, invoiceUpdate, tagDefinitions) =>
    buildBrokerPaymentActivityLog(
      invoice,
      invoiceUpdate,
      tagDefinitions,
      TagDefinitionKey.BROKER_PAYMENT_OVERPAY,
    ),
  nonpayment: buildBrokerNonPaymentActivityLog,
};

const buildUploadToPortalActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.UPLOAD_INVOICE_TO_PORTAL),
    ActivityLogPayloadBuilder.forKey(
      TagDefinitionKey.UPLOAD_INVOICE_TO_PORTAL,
      {
        data: {
          contactPerson: invoiceUpdate.talked_to || '',
          contactType: invoiceUpdate.talked_to_contact_method || '',
          invoiceStatus: mapStatus(invoiceUpdate.update_type),
        },
      },
    ),
  );
};

const buildPaymentUpdateActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.CLIENT_PAYMENT_UPDATE),
  );
};

const buildUnreportedFuelAdvanceActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.UNREPORTED_FUEL_ADVANCE),
  );
};

const buildDeclinedExistingClaimActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(
      tagDefinitions,
      TagDefinitionKey.BROKER_CLAIM_AGAINST_CLIENT,
    ),
  );
};

const buildOver90DaysActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.OVER_90_DAYS),
  );
};

const buildDoubleBrokeredLoadActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.DOUBLED_BROKERED_LOAD),
  );
};

const buildClientLimitExceededActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.CLIENT_LIMIT_EXCEEDED),
  );
};

const buildBrokerLimitExceededActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.BROKER_LIMIT_EXCEEDED),
  );
};

const buildEmailSentActivityLog = (
  _invoice: any,
  invoiceUpdate: any,
  tagDefinitions: TagDefinitionEntity[],
): ActivityLogEntity => {
  return buildActivityLogEntity(
    invoiceUpdate,
    getTagDefinition(tagDefinitions, TagDefinitionKey.EMAIL_SENT),
    ActivityLogPayloadBuilder.forKey(TagDefinitionKey.EMAIL_SENT, {
      data: {
        emails: invoiceUpdate.notes
          .replace('Invoice email sent to ', '')
          .split(','),
      },
    }),
  );
};

const invoiceUpdateStatusMappers: Record<string, ActivityLogSupplier> = {
  'invoice created': buildCreatedActivityLog,
  'invoice approved': buildApprovedActivityLog,
  'possible duplicate': buildPossibleDuplicateActivityLog,
  'pending low credit rating': buildLowCreditActivityLog,
  'declined low credit rating': buildLowCreditActivityLog,
  'invoice returned to pending from approved':
    buildInvoiceReturnedToPendingFromApproved,
  'client paid': buildClientPaidActivityLog,
  'invoice paid': buildBrokerPaymentInFullActivityLog,
  'flag notification sent': buildFlagNotificationActivityLog,
  'filed on bond': buildFiledOnBondActivityLog,
  'broker claim': buildBrokerClaimActivityLog,
  'rate incorrect': buildRateIncorrectActivityLog,
  'broker paid previous factor': buildBrokerPaidPreviousFactorActivityLog,
  'broker cancelled load': buildCancelledLoadActivityLog,
  note: buildNoteActivityLog,
  processing: buildProcessingActivityLog,
  'pending other': buildOtherActivityLog,
  'nonpayment other': buildOtherActivityLog,
  'waiting on verification': buildWaitOnVerificationActivityLog,
  'invoice email sent': buildEmailSentActivityLog,
  'invoice verification skipped': buildBypassVerificationActivityLog,
  'invoice verified': buildInvoiceVerifiedActivityLog,
  'invoice updated': buildInvoiceUpdateActivityLog,
  'payment removed': buildBrokerPaymentRemovedActivityLog,
  'missing paperwork': buildMissingDocumentActivityLog,
  payment: buildBrokerPaymentScheduledActivityLog,
  'missing bol': buildMissingBOLActivityLog,
  'missing rate con': buildMissingRateConActivityLog,
  'multiple rate con': buildMultipleRateConActivityLog,
  'did not pick up': buildBrokerUnresponsiveActivityLog,
  'client balance': buildClientHasNegaticeReserveActivityLog,
  'originals required': buildMailInvoiceOriginalActivityLog,
  'rate con/bol mismatch': buildRateConfirmationBolMismatchActivityLog,
  unreadable: buildUnreadableDocumentActivityLog,
  'no delivery options': buildNoBrokerDeliveryOptionsActivityLog,
  'wrong debtor': buildBrokerNotFoundActivityLog,
  'pending possible claim': buildPossibleClaimOnLoadActivityLog,
  'paid other': buildOtherActivityLog,
  'approved other': buildOtherActivityLog,
  'paid to client': buildBrokerPaidClientDirectlyActivityLog,
  'shortpay reason': buildShortpayReasonActivityLog,
  'broker unresponsive': buildBrokerUnresponsiveActivityLog,
  'missing documents': buildMissingDocumentActivityLog,
  'missing signature': buildMissingSignatureActivityLog,
  'requested paperwork not submitted':
    buildRequestedPaperworkNotSubmittedActivityLog,
  'broker paid to different invoice':
    buildBrokerPaidToDifferentInvoiceActivityLog,
  'debtor claim': buildDebtorClaimActivityLog,
  'mail invoice copy': buildMailInvoiceCopyActivityLog,
  'missing lumper receipt': buildMissingLumperReceiptActivityLog,
  'duplicate invoice': buildDuplicateInvoiceActivityLog,
  'pending existing claim': buildBrokerClaimAgainstClientActivityLog,
  'client needs to contact broker': buildClientNeedsToContactBrokerActivityLog,
  'debtor not found': buildBrokerNotFoundActivityLog,
  'advance taken': buildAdvanceTakenActivityLog,
  'payment sent via echeck': buildBrokerSentPaymentViaECheckActivityLog,
  'email send failed': buildEmailSendFailedActivityLog,
  'email blocked': buildEmailSendBlockedActivityLog,
  'incorrect client rate con': buildIncorrectClientRateConActivityLog,
  'verification unsuccessful': buildVerificationUnsuccessfulActivityLog,
  'load not delivered': buildLoadNotDeliveredActivityLog,
  'did not deliver load': buildLoadNotDeliveredActivityLog,
  'missing scale ticket': buildMissingScaleTicketActivityLog,
  'require scanned bol': buildScannedCopyOfBOLRequiredActivityLog,
  'possible claim on load': buildPossibleClaimOnLoadActivityLog,
  'upload to portal': buildUploadToPortalActivityLog,
  'additional payment fully_paid': buildInvoiceUpdateActivityLog,
  'bobtail transfer failed': buildPaymentUpdateActivityLog,
  'broker verification required': buildInvoiceUpdateActivityLog,
  'invoice returned to approved from paid': buildInvoiceUpdateActivityLog,
  'unreported fuel advance': buildUnreportedFuelAdvanceActivityLog,
  'declined existing claim': buildDeclinedExistingClaimActivityLog,
  'over 90 days': buildOver90DaysActivityLog,
  'double brokered load': buildDoubleBrokeredLoadActivityLog,
  'client limit exceeded': buildClientLimitExceededActivityLog,
  'broker limit exceeded': buildBrokerLimitExceededActivityLog,
};
