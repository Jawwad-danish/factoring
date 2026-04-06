import { Note } from '@core/data';
import { UUID } from '@core/util';
import { EntityManager, raw } from '@mikro-orm/postgresql';
import { AbstractSqlDriver } from '@mikro-orm/postgresql';
import {
  ActivityLogEntity,
  BrokerFactoringConfigEntity,
  BrokerPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  InvoiceTagEntity,
  RecordStatus,
  TagDefinitionEntity,
  TagDefinitionKey,
  TagStatus,
  UsedByType,
} from '@module-persistence';

export const updateInvoiceTags = async (
  em: EntityManager<AbstractSqlDriver>,
  brokerConfig: BrokerFactoringConfigEntity,
  limitAmount: Big | null,
  tagDefinition: TagDefinitionEntity,
) => {
  // get total of Purchased and broker Unpaid invoices.
  const amount = await getTotalAmountUnpaidByBrokerInvoices(
    em,
    brokerConfig.brokerId,
  );
  if (limitAmount && limitAmount.lt(amount)) {
    console.log(`Broker limit lesser than the amount. Tagging invoices`);
    const noteDetails = Note.from({
      payload: {
        brokerLimitAmount: limitAmount.toFixed(),
        arAmount: amount.toFixed(),
      },
    });
    await tagInvoices(em, brokerConfig.brokerId, tagDefinition, noteDetails);
    return;
  }
  console.log(
    `Broker limit is NULL or greater than the amount. Untagging invoices`,
  );
  await unTagInvoices(em, brokerConfig.brokerId, tagDefinition);
  return;
};

const getAllUnderReviewTaggedInvoices = async (
  em: EntityManager<AbstractSqlDriver>,
  brokerId: string,
): Promise<InvoiceEntity[]> => {
  const qb = em.createQueryBuilder(InvoiceEntity, 'i');

  qb.select('*').join('i.tags', 't').join('t.tagDefinition', 'd').where({
    brokerId,
    status: InvoiceStatus.UnderReview,
  });

  qb.andWhere('t.record_status = ?', [RecordStatus.Active]);
  qb.andWhere('d.key = ?', [TagDefinitionKey.BROKER_LIMIT_EXCEEDED]);

  return await qb.getResult();
};

const getAllUnderReviewUnTaggedInvoices = async (
  em: EntityManager<AbstractSqlDriver>,
  brokerId: string,
): Promise<InvoiceEntity[]> => {
  const qb = em.createQueryBuilder(InvoiceEntity, 'i');

  qb.where({
    brokerId,
    status: InvoiceStatus.UnderReview,
  });

  qb.andWhere(
    `
  NOT EXISTS (
    SELECT 1
    FROM invoice_tag_assoc t
    JOIN tag_definitions d ON t.tag_definition_id = d.id
    WHERE t.invoice_id = i.id
      AND t.record_status = ?
      AND d.key = ?
  )
`,
    [RecordStatus.Active, TagDefinitionKey.BROKER_LIMIT_EXCEEDED],
  );

  return await qb.getResult();
};

const getTotalAmountUnpaidByBrokerInvoices = async (
  em: EntityManager<AbstractSqlDriver>,
  brokerId: string,
): Promise<number> => {
  const queryResult = await em
    .createQueryBuilder(InvoiceEntity)
    .select(raw('SUM(value) as total'))
    .where({
      brokerId,
      recordStatus: RecordStatus.Active,
      status: InvoiceStatus.Purchased,
      brokerPaymentStatus: BrokerPaymentStatus.NotReceived,
    })
    .execute('all', false);

  const rawResult = queryResult[0] as any;
  return Number(rawResult?.total) ?? 0;
};

const buildNote = (tag: TagDefinitionEntity, noteDetails: Note): string => {
  if (noteDetails.hasText()) {
    return noteDetails.getText();
  }
  if (tag.notePlaceholders) {
    return noteDetails.getPlaceholderAwareNote(tag.note, tag.notePlaceholders);
  }
  return tag.note;
};

const unTagInvoices = async (
  em: EntityManager<AbstractSqlDriver>,
  brokerId: string,
  tagDefinition: TagDefinitionEntity,
) => {
  const taggedInvoices = await getAllUnderReviewTaggedInvoices(em, brokerId);
  console.log(`Found invoices for unTagging: ${taggedInvoices.length}`);
  const invoiceIds = taggedInvoices.map((invoice) => invoice.id);

  // Remove tags
  await em.nativeUpdate(
    InvoiceTagEntity,
    {
      invoice: {
        id: { $in: invoiceIds },
        tags: {
          recordStatus: RecordStatus.Active,
          tagDefinition: {
            key: TagDefinitionKey.BROKER_LIMIT_EXCEEDED,
          },
        },
      },
    },
    { recordStatus: RecordStatus.Inactive },
  );

  taggedInvoices.forEach((invoice) => {
    // add activity
    const activityLog = new ActivityLogEntity();
    activityLog.tagDefinition = tagDefinition;
    activityLog.note = `Deleted tag ${tagDefinition.name}`;
    activityLog.payload = {};
    activityLog.groupId = UUID.get();
    activityLog.tagStatus = TagStatus.Inactive;
    activityLog.invoice = invoice;
    em.persist(activityLog);
  });
  em.persist(taggedInvoices);
  await em.flush();
};

const tagInvoices = async (
  em: EntityManager<AbstractSqlDriver>,
  brokerId: string,
  tagDefinition: TagDefinitionEntity,
  noteDetails: Note,
) => {
  const unTaggedInvoices = await getAllUnderReviewUnTaggedInvoices(
    em,
    brokerId,
  );
  console.log(`Found invoices for Tagging: ${unTaggedInvoices.length}`);
  unTaggedInvoices.forEach((invoice) => {
    // add tag BROKER_LIMIT_EXCEEDED
    const invoiceTagActivity = new InvoiceTagEntity();
    invoiceTagActivity.invoice = invoice;
    invoiceTagActivity.tagDefinition = tagDefinition;
    invoiceTagActivity.assignedByType = UsedByType.System;
    invoice.tags.add(invoiceTagActivity);
    em.persist(invoiceTagActivity);

    // add activity
    const activityLog = new ActivityLogEntity();
    activityLog.tagDefinition = tagDefinition;
    activityLog.note = buildNote(tagDefinition, noteDetails);
    activityLog.payload = noteDetails.payload;
    activityLog.groupId = UUID.get();
    invoice.activities.add(activityLog);
    em.persist(activityLog);
  });
  em.persist(unTaggedInvoices);
  await em.flush();
};
