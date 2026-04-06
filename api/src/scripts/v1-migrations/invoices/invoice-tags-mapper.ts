import {
  InvoiceTagEntity,
  RecordStatus,
  TagDefinitionEntity,
  TagDefinitionKey,
  UsedByType,
} from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { isSystemUser, referenceUserData } from '../../util';
import { allInvoiceStatuses } from '../constants';
import { EntityManager } from '@mikro-orm/core';

const logger = new Logger('invoice-tags-mapper');

const tagToFlagMappings: Partial<Record<TagDefinitionKey, string[]>> = {
  BROKER_UNRESPONSIVE: ['broker unresponsive', 'did not pick up'],
  FILED_ON_BROKER_BOND: ['filed on bond'],
  BROKER_PAID_TO_DIFFERENT_INVOICE: ['broker paid to different invoice'],
  BROKER_SENT_PAYMENT_VIA_E_CHECK: ['payment sent via echeck'],
  BROKER_PAYMENT_SCHEDULED: ['payment'],
  TRANSFER_FAILED: ['bobtail transfer failed'],
  MISSING_BILL_OF_LADING: ['missing bol'],
  MISSING_RATE_CONFIRMATION: ['missing rate con'],
  MISSING_RECEIVER_SIGNATURE: ['missing signature'],
  RATE_CONFIRMATION_BILL_OF_LADING_MISMATCH: ['rate con/bol mismatch'],
  INCORRECT_RATE_ADDED: ['rate incorrect'],
  UNREADABLE_DOCUMENT: ['unreadable'],
  MULTIPLE_RATE_CONFIRMATION_DOCUMENTS: ['multiple rate con'],
  MISSING_LUMPER_RECEIPT: ['missing lumper receipt'],
  SCANNED_COPY_OF_BILL_OF_LADING_REQUIRED: ['require scanned bol'],
  INCORRECT_BROKER_ON_RATE_CONFIRMATION: ['incorrect broker rate con'],
  NO_PAPERWORK_UPLOADED: ['no paperwork uploaded'],
  CLIENT_NEEDS_TO_CONTACT_BROKER: ['client needs to contact broker'],
  MISSING_DOCUMENT: ['missing documents', 'missing paperwork'],
  MISSING_SCALE_TICKET: ['missing scale ticket'],
  BROKER_CANCELLED_LOAD: ['broker cancelled load'],
  UNREPORTED_FUEL_ADVANCE: ['unreported fuel advance'],
  BROKER_INFORMATION_MISSING: ['no delivery options'],
  INVOICE_EMAIL_BLOCKED: ['email blocked'],
  UPLOAD_INVOICE_TO_PORTAL: ['upload to portal'],
  MAIL_INVOICE_COPY: ['mail invoice copy'],
  MAIL_INVOICE_ORIGINAL: ['originals required'],
  OVER_90_DAYS: ['over 90 days'],
  DOUBLED_BROKERED_LOAD: ['double brokered load'],
  BROKER_NOT_FOUND: ['debtor not found', 'wrong debtor'],
  POSSIBLE_DUPLICATE_INVOICE: ['possible duplicate'],
  VERIFICATION_ENGINE: ['broker verification required'],
  WAITING_FOR_BROKER_VERIFICATION: ['waiting on verification'],
  CLIENT_HAS_NEGATIVE_RESERVES: ['client balance'],
  LOW_BROKER_CREDIT_RATING: [
    'declined low credit rating',
    'low broker credit rating',
    'pending low credit rating',
  ],
  POSSIBLE_CLAIM_ON_LOAD: ['declined possible claim', 'possible claim on load'],
  BROKER_CLAIM_AGAINST_CLIENT: [
    'declined existing claim',
    'pending possible claim',
    'pending existing claim',
    'debtor claim',
    'broker claim against client',
  ],
  BROKER_PAID_CLIENT_DIRECTLY: ['paid to client'],
  DUPLICATE_INVOICE: ['duplicate invoice'],
  LOAD_NOT_DELIVERED: ['load not delivered', 'did not deliver load'],
  BROKER_PAID_PREVIOUS_FACTOR: ['broker paid previous factor'],
  OTHER_INVOICE_ISSUE: [
    'other',
    'declined other',
    'pending other',
    'paid other',
    'other invoice issues',
    'approved other',
  ],
  BROKER_PAYMENT_SHORTPAY: ['shortpay reason'],
  NOTIFICATION: ['flag notification sent'],
  INCORRECT_CLIENT_ON_RATE_CONFIRMATION: ['incorrect client rate con'],
  NOTE: ['note'],
  REQUESTED_PAPERWORK_NOT_SUBMITTED: ['requested paperwork not submitted'],
  VERIFICATION_UNSUCCESSFUL: ['verification unsuccessful'],
  POD_AND_RATE_CON_NOT_MATCHING: ['pod and rate con do not match'],
  CLIENT_LIMIT_EXCEEDED: ['client limit exceeded'],
  BROKER_LIMIT_EXCEEDED: ['broker limit exceeded'],
};
export const flagStatuses = Object.values(tagToFlagMappings).flat();

export const mapInvoiceTags = (
  invoice: any,
  tagDefinitions: TagDefinitionEntity[],
  em: EntityManager,
): InvoiceTagEntity[] => {
  const invoiceTagEntities: InvoiceTagEntity[] = [];

  const alreadyIncluded: string[] = [];
  invoice?.invoice_updates
    ?.filter((update: any) => flagStatuses.includes(update.update_status))
    .forEach((update: any) => {
      const foundTagDefinition = getTagDefinitionFromFlag(
        tagDefinitions,
        update.update_status,
      );
      const isFlag =
        allInvoiceStatuses[update.update_type][update.update_status]?.flagged;
      if (isFlag && alreadyIncluded.indexOf(update.update_status) === -1) {
        alreadyIncluded.push(update.update_status);
        if (foundTagDefinition) {
          const invoiceTag = new InvoiceTagEntity();
          invoiceTag.tagDefinition = foundTagDefinition;
          invoiceTag.createdAt = new Date(update.created_at);
          invoiceTag.recordStatus = update.allegedly_fixed
            ? RecordStatus.Inactive
            : RecordStatus.Active;
          invoiceTag.assignedByType = isSystemUser(update.created_by)
            ? UsedByType.System
            : UsedByType.User;
          referenceUserData(invoiceTag, update, em);
          invoiceTagEntities.push(invoiceTag);
        } else {
          console.error(
            'Could not assign tag because no tag definition found from the update',
            {
              invoiceId: invoice.id,
              invoiceUpdateId: update.id,
              invoiceUpdateStatus: update.update_status,
              invoiceUpdateType: update.update_type,
            },
          );
        }
      }
    });

  return invoiceTagEntities;
};

export const getTagDefinitionFromFlag = (
  tagDefinitions: TagDefinitionEntity[],
  flag: TagDefinitionKey,
): TagDefinitionEntity | undefined => {
  const entries = Object.entries(tagToFlagMappings);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const foundFlag = entries.find((entry, _) => entry[1].includes(flag));
  if (foundFlag) {
    return tagDefinitions.find((definition) => definition.key === foundFlag[0]);
  } else {
    logger.error(
      `Could not find association between flag ${flag} and tag definitions`,
    );
    return;
  }
};
