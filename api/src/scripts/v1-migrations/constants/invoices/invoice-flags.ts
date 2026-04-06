import {
  CLIENT_NEEDS_TO_CONTACT_BROKER,
  DEBTOR_NOT_FOUND,
  LOAD_NOT_DELIVERED,
  DOUBLE_BROKERED_LOAD,
  DUPLICATE_INVOICE,
} from './broker-flags';

const pendingStatuses = {
  'advance taken': { flagged: true, flagged_previously_pending: true },
  'broker cancelled load': { flagged: true, flagged_previously_pending: true },
  'broker verification required': {
    flagged: true,
    flagged_previously_pending: true,
  },
  'client balance': { flagged: true, flagged_previously_pending: true },
  [CLIENT_NEEDS_TO_CONTACT_BROKER]: {
    flagged: true,
    flagged_previously_pending: true,
  },
  'debtor claim': { flagged: true, flagged_previously_pending: true },
  [DEBTOR_NOT_FOUND]: { flagged: true, flagged_previously_pending: true },
  'incorrect client rate con': {
    flagged: true,
    flagged_previously_pending: true,
  },
  [LOAD_NOT_DELIVERED]: { flagged: true, flagged_previously_pending: true },
  'missing bol': { flagged: true, flagged_previously_pending: true },
  'missing documents': { flagged: true, flagged_previously_pending: true },
  'missing lumper receipt': { flagged: true, flagged_previously_pending: true },
  'missing rate con': { flagged: true, flagged_previously_pending: true },
  'missing scale ticket': { flagged: true, flagged_previously_pending: true },
  'missing signature': { flagged: true, flagged_previously_pending: true },
  'multiple rate con': { flagged: true, flagged_previously_pending: true },
  'no delivery options': { flagged: true, flagged_previously_pending: true },
  'no paperwork uploaded': { flagged: true, flagged_previously_pending: true },
  'rate con/bol mismatch': { flagged: true, flagged_previously_pending: true },
  'rate incorrect': { flagged: true, flagged_previously_pending: true },
  'pending existing claim': { flagged: true, flagged_previously_pending: true },
  'pending low credit rating': {
    flagged: true,
    flagged_previously_pending: true,
  },
  'pending other': { flagged: true, flagged_previously_pending: true },
  'pending possible claim': { flagged: true, flagged_previously_pending: true },
  'possible claim on load': { flagged: true, flagged_previously_pending: true },
  'possible duplicate': { flagged: true, flagged_previously_pending: true },
  'rate con not updated': { flagged: true, flagged_previously_pending: true },
  'require scanned bol': { flagged: true, flagged_previously_pending: true },
  unreadable: { flagged: true, flagged_previously_pending: true },
  'unreported fuel advance': {
    flagged: true,
    flagged_previously_pending: true,
  },
  verified: {},
  'wrong debtor': { flagged: true, flagged_previously_pending: true },
  'waiting on verification': {
    flagged: true,
    flagged_previously_pending: true,
  },
};
const approvedStatuses = {
  'approved other': { flagged: true, flagged_previously_approved: true },
  'bobtail transfer failed': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'broker cancelled load': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'broker paid previous factor': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'broker paid to different invoice': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'broker unresponsive': {
    flagged: true,
    flagged_previously_approved: true,
  },
  [CLIENT_NEEDS_TO_CONTACT_BROKER]: {
    flagged: true,
    flagged_previously_approved: true,
  },
  'debtor claim': { flagged: true, flagged_previously_approved: true },
  [DEBTOR_NOT_FOUND]: { flagged: true, flagged_previously_approved: true },
  'did not pick up': {},
  [DOUBLE_BROKERED_LOAD]: {
    flagged: true,
    flagged_previously_approved: true,
  },
  [DUPLICATE_INVOICE]: {
    flagged: true,
    flagged_previously_approved: true,
  },
  'email blocked': { flagged: true, flagged_previously_approved: true },
  'filed on bond': { flagged: true, flagged_previously_approved: true },
  'incorrect client rate con': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'invoice amount incorrect': {
    flagged: true,
    flagged_previously_approved: true,
  },
  [LOAD_NOT_DELIVERED]: {
    flagged: true,
    flagged_previously_approved: true,
  },
  'mail invoice copy': { flagged: true, flagged_previously_approved: true },
  'missing bol': { flagged: true, flagged_previously_approved: true },
  'missing documents': { flagged: true, flagged_previously_approved: true },
  'missing lumper receipt': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'missing paperwork': { flagged: true, flagged_previously_approved: true },
  'missing rate con': { flagged: true, flagged_previously_approved: true },
  'missing scale ticket': { flagged: true, flagged_previously_approved: true },
  'missing signature': { flagged: true, flagged_previously_approved: true },
  'multiple rate con': { flagged: true, flagged_previously_approved: true },
  'no delivery options': { flagged: true, flagged_previously_approved: true },
  'originals required': { flagged: true, flagged_previously_approved: true },
  'paid to client': { flagged: true, flagged_previously_approved: true },
  payment: { flagged: false, clear_flags: true },
  'payment sent via echeck': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'pending possible claim': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'possible claim on load': {
    flagged: true,
    flagged_previously_approved: true,
  },
  processing: { flagged: false, flagged_previously_approved: true },
  'rate con/bol mismatch': { flagged: true, flagged_previously_approved: true },
  'rate incorrect': { flagged: true, flagged_previously_approved: true },
  'require scanned bol': { flagged: true, flagged_previously_approved: true },
  unreadable: { flagged: true, flagged_previously_approved: true },
  'unreported fuel advance': {
    flagged: true,
    flagged_previously_approved: true,
  },
  'upload to portal': {
    flagged: true,
    flagged_previously_approved: true,
  },
};
const paidStatuses = {
  'debtor claim': { flagged: true },
  [DEBTOR_NOT_FOUND]: {},
  'filed on bond': { flagged: true },
  'paid other': { flagged: true },
  'shortpay reason': { flagged: true },
};

const declinedStatuses = {
  [DEBTOR_NOT_FOUND]: {},
  'declined existing claim': {},
  'declined low credit rating': {},
  'declined other': {},
  'declined possible claim': {},
  [DUPLICATE_INVOICE]: {},
};

const noteStatuses = {
  'log entry': {},
  'invoice email sent': {},
  'new file uploaded': {},
  'file edited': {},
  'file removed': {},
  'flag notification sent': {},
  note: {},
  'email blocked': { flagged: true, flagged_previously_pending: true },
};

const invoiceActionStatuses = {
  'invoice updated': {},
  'verification failure': {},
  'invoice verified': {},
  'invoice verification skipped': {},
  'invoice returned to approved from paid': {},
  'invoice returned to pending from approved': {},
  'invoice declined': {},
  'invoice approved': {},
  'payment removed': {},
  'payment edited': {},
  'invoice created': {},
  'invoice paid': {},
  'invoice deleted': {},
  'client paid': {},
  'possible duplicate': {
    flagged: true,
    flagged_previously_possible_duplicate: true,
  },
  'email send failed': {},
};

const paymentStatuses = {
  pending_payment: {
    'pending payment other': {},
  },
  shortpay: {
    'fuel advance': {},
    'missing paperwork': {},
    'damaged load': {},
    'debtor claim': {},
    'late delivery': {},
    'shortpay other': {},
    'additional payment shortpay': {},
  },
  overpay: {
    overpayment: {},
    'additional payment overpay': {},
    'overpay other': {},
  },
  nonpayment: {
    'paid to client': {},
    'did not deliver load': {},
    [DUPLICATE_INVOICE]: {},
    'over 90 days': {},
    'debtor claim': {},
    [DOUBLE_BROKERED_LOAD]: {},
    'paid to different factoring company': {},
    'nonpayment other': {},
  },
  fully_paid: {
    'additional payment fully_paid': {},
    'fully paid other': {},
  },
};

export const allInvoiceStatuses = {
  pending: pendingStatuses,
  approved: approvedStatuses,
  declined: declinedStatuses,
  paid: paidStatuses,
  note: noteStatuses,
  'invoice action': invoiceActionStatuses,
  ...paymentStatuses,
};
