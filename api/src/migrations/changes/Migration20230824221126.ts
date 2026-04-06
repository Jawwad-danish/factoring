import { Migration, Query } from '@mikro-orm/migrations';
import {
  TagDefinitionGroupKey,
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  UsedByType,
} from '@module-persistence/entities';
import { TagsQueryGenerator } from '../utils';
import { TagGroupBuilder } from '../utils/builders/tag-group-builder';

export class Migration20230818104435 extends Migration {
  async up(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const baseTagsQuery = tagsQueryGenerator.addTags(baseTags);
    this.addSql(baseTagsQuery);

    const sharedTagsQuery = tagsQueryGenerator.addTags(sharedTags);
    this.addSql(sharedTagsQuery);

    const tagGroupsQueries: Query[] = groups.flatMap((group) => {
      return tagsQueryGenerator.createTagGroup(group);
    });

    for (const query of tagGroupsQueries) {
      this.addSql(query);
    }
  }

  async down(): Promise<void> {
    const tagsQueryGenerator = new TagsQueryGenerator(this.driver);
    const baseTagsRemovalQuery = tagsQueryGenerator.removeTags(
      baseTags.map((tag) => tag.key),
    );
    this.addSql(baseTagsRemovalQuery);

    const tagGroupsToRemove: string[] = [];
    const tagsToRemove: string[] = [];
    for (const group of groups) {
      tagsToRemove.push(...group.tagData.map((tag) => tag.key as string));
      tagGroupsToRemove.push(group.groupData.key);
    }

    const groupTagsRemovalQuery = tagsQueryGenerator.removeTags(tagsToRemove);
    this.addSql(groupTagsRemovalQuery);

    const tagGroupAssociationsRemovalQuery =
      tagsQueryGenerator.removeTagGroupAssociationByGroupKeys(
        tagGroupsToRemove,
      );
    this.addSql(tagGroupAssociationsRemovalQuery);

    const tagGroupsRemovalQuery =
      tagsQueryGenerator.removeTagGroups(tagGroupsToRemove);

    this.addSql(tagGroupsRemovalQuery);

    const sharedTagsRemovalQuery = tagsQueryGenerator.removeTags(
      sharedTags.map((tag) => tag.key),
    );
    this.addSql(sharedTagsRemovalQuery);
  }
}

const baseTags = [
  {
    name: 'Create invoice',
    key: 'CREATE_INVOICE' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Invoice created for client ${client} and broker ${broker} for amount ${amount}',
    notePlaceholders: ['client', 'broker', 'amount'],
  },
  {
    name: 'Update invoice',
    key: 'UPDATE_INVOICE' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Invoice updated',
  },
  {
    name: 'Delete invoice',
    key: 'DELETE_INVOICE' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Invoice deleted',
  },
  {
    name: 'Notification',
    key: 'NOTIFICATION' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Flag notification sent via text ${text} and email to ${email}',
    notePlaceholders: ['text', 'email'],
  },
  {
    name: 'Create Client Broker Assignment',
    key: 'CREATE_CLIENT_BROKER_ASSIGNMENT' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Created assignment between client ${client} and broker ${broker}',
    notePlaceholders: ['client', 'broker'],
  },
  {
    name: 'Update Client Broker Assignment',
    key: 'UPDATE_CLIENT_BROKER_ASSIGNMENT' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Updated assignment between client ${client} and broker ${broker}',
    notePlaceholders: ['client', 'broker'],
  },
  {
    name: 'Documents Delete',
    key: 'DOCUMENTS_DELETE' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Deleted documents ${names}',
    notePlaceholders: ['names'],
  },
  {
    name: 'Documents Add',
    key: 'DOCUMENTS_ADD' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Added documents ${names}',
    notePlaceholders: ['names'],
  },
  {
    name: 'Other',
    key: 'OTHER' as TagDefinitionKey,
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Warning,
    note: 'Other',
  },
  {
    name: 'Paid to Client',
    key: 'PAID_TO_CLIENT' as TagDefinitionKey,
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Info,
    note: 'Paid ${amount} as part of ${batchAmount} batch, expected arrival ${arrivalDate} by ${arrivalTime} in account ${account}',
    notePlaceholders: [
      'amount',
      'batchAmount',
      'arrivalDate',
      'arrivalTime',
      'account',
    ],
  },
  {
    name: 'Client on hold',
    key: 'CLIENT_ON_HOLD' as TagDefinitionKey,
    usedBy: [UsedByType.System],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Warning,
    note: 'Client ${client} has status on hold',
    notePlaceholders: ['client'],
  },
  {
    name: 'Client status issue',
    key: 'CLIENT_STATUS_ISSUE' as TagDefinitionKey,
    usedBy: [UsedByType.System, UsedByType.User],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Warning,
    note: 'Client ${client} has status ${status}',
    notePlaceholders: ['client', 'status'],
  },
];

const sharedTags = [
  {
    name: 'Possible claim on load',
    key: 'POSSIBLE_CLAIM_ON_LOAD' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Error,
    note: 'Broker claim on load',
  },
  {
    name: 'Broker claim against Client',
    key: 'BROKER_CLAIM_AGAINST_CLIENT' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Error,
    note: 'Broker claim against client',
  },
  {
    name: 'Broker paid Client directly',
    key: 'BROKER_PAID_CLIENT_DIRECTLY' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Broker paid client directly',
  },
  {
    name: 'Duplicate invoice',
    key: 'DUPLICATE_INVOICE' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Error,
    note: 'Duplicate invoice',
  },
  {
    name: 'Load not delivered',
    key: 'LOAD_NOT_DELIVERED' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.All,
    level: TagDefinitionLevel.Error,
    note: 'Load not delivered',
  },
  {
    name: 'Broker paid previous factor',
    key: 'BROKER_PAID_PREVIOUS_FACTOR' as TagDefinitionKey,
    usedBy: [UsedByType.User],
    visibility: TagDefinitionVisibility.Employee,
    level: TagDefinitionLevel.Error,
    note: 'Broker paid previous factor',
  },
];

const invoiceIssuesGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Invoice Issues',
      key: 'INVOICE_ISSUES' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Missing Bill of Lading',
        key: 'MISSING_BILL_OF_LADING' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Missing Bill of Lading',
      },
      {
        name: 'Missing Rate Confirmation',
        key: 'MISSING_RATE_CONFIRMATION' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Missing Rate Confirmation',
      },
      {
        name: `Missing receiver's signature`,
        key: 'MISSING_RECEIVER_SIGNATURE' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: `Missing receiver's signature`,
      },
      {
        name: `Rate Confirmation and Bill of Lading don't match`,
        key: 'RATE_CONFIRMATION_BILL_OF_LADING_MISMATCH' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: `Rate Confirmation and Bill of Lading don't match`,
      },
      {
        name: 'Incorrect rate added',
        key: 'INCORRECT_RATE_ADDED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Incorrect rate added',
      },
      {
        name: 'Unreadable document',
        key: 'UNREADABLE_DOCUMENT' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Unreadable document',
      },
      {
        name: 'Multiple Rate Confirmation documents',
        key: 'MULTIPLE_RATE_CONFIRMATION_DOCUMENTS' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Multiple Rate Confirmation documents',
      },
      {
        name: 'Missing lumper receipt',
        key: 'MISSING_LUMPER_RECEIPT' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Missing lumper receipt',
      },
      {
        name: 'Scanned copy of Bill of Lading required',
        key: 'SCANNED_COPY_OF_BILL_OF_LADING_REQUIRED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Scanned copy of Bill of Lading required',
      },
      {
        name: 'Incorrect Broker on Rate Confirmation',
        key: 'INCORRECT_BROKER_ON_RATE_CONFIRMATION' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Incorrect Broker on Rate Confirmation',
      },
      {
        name: 'Incorrect Client on Rate Confirmation',
        key: 'INCORRECT_CLIENT_ON_RATE_CONFIRMATION' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Incorrect Client on Rate Confirmation',
      },
      {
        name: 'No paperwork uploaded',
        key: 'NO_PAPERWORK_UPLOADED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'No paperwork uploaded',
      },
      {
        name: 'Client needs to contact broker',
        key: 'CLIENT_NEEDS_TO_CONTACT_BROKER' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Client needs to contact broker',
      },
      {
        name: 'Missing document',
        key: 'MISSING_DOCUMENT' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Missing document',
      },
      {
        name: 'Missing scale ticket',
        key: 'MISSING_SCALE_TICKET' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Missing scale ticket',
      },
      {
        name: 'Broker cancelled load',
        key: 'BROKER_CANCELLED_LOAD' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker cancelled load',
      },
      {
        name: 'Unreported fuel advance',
        key: 'UNREPORTED_FUEL_ADVANCE' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Unreported fuel advance',
      },
      {
        name: 'Other invoice issue',
        key: 'OTHER_INVOICE_ISSUE' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Other invoice issue',
      },
      {
        name: 'Note',
        key: 'NOTE' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Note',
      },
    ],
  );
};

const issuesSendingInvoiceToBrokerGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Issue Sending Invoice to Broker',
      key: 'ISSUES_SENDING_INVOICE_TO_BROKER' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Broker information missing',
        key: 'BROKER_INFORMATION_MISSING' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker information missing for ${broker}',
        notePlaceholders: ['broker'],
      },
      {
        name: 'Invoice email blocked',
        key: 'INVOICE_EMAIL_BLOCKED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Invoice email blocked',
      },
      {
        name: 'Upload invoice to portal',
        key: 'UPLOAD_INVOICE_TO_PORTAL' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Info,
        note: 'Upload invoice to portal',
      },
      {
        name: 'Mail invoice copy',
        key: 'MAIL_INVOICE_COPY' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Info,
        note: 'Mail invoice copy',
      },
      {
        name: 'Mail invoice original',
        key: 'MAIL_INVOICE_ORIGINAL' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Mail invoice original',
      },
    ],
  );
};

const nonPaymentReasonsGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Non-payment Reasons',
      key: 'NON_PAYMENT_REASONS' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Over 90 days',
        key: 'OVER_90_DAYS' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Over 90 days',
      },
      {
        name: 'Double brokered load',
        key: 'DOUBLED_BROKERED_LOAD' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Double brokered load',
      },
    ],
  );
};

const processingActionItemsGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Processing Action Items',
      key: 'PROCESSING_ACTION_ITEMS' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Broker not found',
        key: 'BROKER_NOT_FOUND' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker not found',
      },
      {
        name: 'Possible duplicate invoice',
        key: 'POSSIBLE_DUPLICATE_INVOICE' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Warning,
        note: 'Possible duplicate invoices ${possibleDuplicates} for invoice with load number ${loadNumber}',
        notePlaceholders: ['loadNumber', 'possibleDuplicates'],
      },
      {
        name: 'Broker verification required',
        key: 'BROKER_VERIFICATION_REQUIRED' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker verification required',
      },
      {
        name: 'Waiting for Broker verification',
        key: 'WAITING_FOR_BROKER_VERIFICATION' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Waiting for Broker verification',
      },
      {
        name: 'Client has negative reserve',
        key: 'CLIENT_HAS_NEGATIVE_RESERVES' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Client has negative reserve',
      },
    ],
  );
};

const rejectionReasonsGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Rejection Reasons',
      key: 'REJECTION_REASONS' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Low broker credit rating',
        key: 'LOW_BROKER_CREDIT_RATING' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Broker ${broker} has a low credit rating of ${rating}',
        notePlaceholders: ['broker', 'rating'],
      },
    ],
  );
};

const clientPaymentIssuesGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Client Payment Issues',
      key: 'CLIENT_PAYMENT_ISSUES' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Bobtail transfer failed',
        key: 'TRANSFER_FAILED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Bobtail transfer failed',
      },
    ],
  );
};

const brokerPaymentIssuesGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Broker Payment Issues',
      key: 'BROKER_PAYMENT_ISSUES' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Broker unresponsive',
        key: 'BROKER_UNRESPONSIVE' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Broker unresponsive',
      },
      {
        name: 'Filed on broker bond',
        key: 'FILED_ON_BROKER_BOND' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Error,
        note: 'Filed on broker bond',
      },
      {
        name: 'Broker paid to different invoice',
        key: 'BROKER_PAID_TO_DIFFERENT_INVOICE' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker paid to different invoice',
      },
      {
        name: 'Broker sent payment via e-check',
        key: 'BROKER_SENT_PAYMENT_VIA_E_CHECK' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker sent payment via e-check',
      },
      {
        name: 'Broker payment scheduled',
        key: 'BROKER_PAYMENT_SCHEDULED' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment scheduled',
      },
    ],
  );
};

const brokerPaymentActionItemsGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Broker Payment Action Items',
      key: 'BROKER_PAYMENT_ACTION_ITEMS' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Broker payment in full',
        key: 'BROKER_PAYMENT_IN_FULL' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment in full',
      },
      {
        name: 'Broker short payment',
        key: 'BROKER_PAYMENT_SHORTPAY' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker short payment',
      },
      {
        name: 'Broker over payment',
        key: 'BROKER_PAYMENT_OVERPAY' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker over payment',
      },
      {
        name: 'Broker non payment',
        key: 'BROKER_PAYMENT_NON_PAYMENT' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker non payment',
      },
      {
        name: 'Broker payment not received',
        key: 'BROKER_PAYMENT_NOT_RECEIVED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment not received',
      },
      {
        name: 'Broker payment pending',
        key: 'BROKER_PAYMENT_PENDING' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment pending',
      },
      {
        name: 'Broker payment non factored',
        key: 'BROKER_PAYMENT_NON_FACTORED' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.All,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment non factored',
      },
      {
        name: 'Broker payment updated',
        key: 'BROKER_PAYMENT_UPDATE' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment updated',
      },
      {
        name: 'Broker payment deleted',
        key: 'BROKER_PAYMENT_DELETE' as TagDefinitionKey,
        usedBy: [UsedByType.User],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Info,
        note: 'Broker payment deleted',
      },
    ],
  );
};

const brokerConfigurationGroupBuilder = (): TagGroupBuilder => {
  return new TagGroupBuilder(
    {
      name: 'Broker Configuration',
      key: 'BROKER_CONFIGURATION' as TagDefinitionGroupKey,
    },
    [
      {
        name: 'Broker require copies',
        key: 'BROKER_REQUIRE_COPIES' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker require copies',
      },
      {
        name: 'Broker require originals',
        key: 'BROKER_REQUIRE_ORIGINALS' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker require originals',
      },
      {
        name: 'Broker require online submit',
        key: 'BROKER_REQUIRE_ONLINE_SUBMIT' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker require online submit',
      },
      {
        name: 'Broker require fax',
        key: 'BROKER_REQUIRE_FAX' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker require fax',
      },
      {
        name: 'Broker require email',
        key: 'BROKER_REQUIRE_EMAIL' as TagDefinitionKey,
        usedBy: [UsedByType.System],
        visibility: TagDefinitionVisibility.Employee,
        level: TagDefinitionLevel.Error,
        note: 'Broker require email',
      },
    ],
  );
};

const groups: TagGroupBuilder[] = [
  invoiceIssuesGroupBuilder(),
  issuesSendingInvoiceToBrokerGroupBuilder(),
  nonPaymentReasonsGroupBuilder(),
  processingActionItemsGroupBuilder(),
  rejectionReasonsGroupBuilder(),
  clientPaymentIssuesGroupBuilder(),
  brokerConfigurationGroupBuilder(),
  brokerPaymentIssuesGroupBuilder(),
  brokerPaymentActionItemsGroupBuilder(),
];
