import {
  InvoiceStatus,
  VerificationStatus,
} from '@module-persistence/entities';

export interface ActivityPayload {
  placeholders?: Record<string, string>;
  data: Record<string, any>;
}

export interface InvoiceStatusPayload extends ActivityPayload {
  data: {
    invoice: {
      status: InvoiceStatus;
    };
  };
}

export interface BrokerPaidPreviousFactorActivityPayload
  extends ActivityPayload {
  data: {
    invoice: {
      status: InvoiceStatus;
    };
  };
}

export interface LowCreditBrokerActivityPayload extends ActivityPayload {
  placeholders: {
    broker: string;
    rating: string;
  };
  data: {
    broker: {
      id: string;
      name: string;
      rating: string;
    };
    invoice: {
      status: InvoiceStatus;
    };
  };
}

export interface BrokerNotFoundActivityPayload extends ActivityPayload {
  placeholders: {
    loadNumber: string;
  };
  data: {
    invoice: {
      loadNumber: string;
      status: InvoiceStatus;
    };
  };
}

export interface FiledOnBrokerBondActivityPayload extends ActivityPayload {
  data: {
    talk: {
      to: string;
      contactMethod: string;
    };
    invoice: {
      status: InvoiceStatus;
    };
  };
}

export interface CreateInvoiceActivityPayload extends ActivityPayload {
  placeholders: {
    client: string;
    broker: string;
    amount: string;
  };
  data: {
    client: string;
    broker: string;
    amount: number;
  };
}

export interface ClientOnHoldActivityPayload extends ActivityPayload {
  placeholders: {
    client: string;
  };
  data: {
    clientId: string;
    clientName: string;
  };
}

export interface ClientStatusIssuePayload extends ActivityPayload {
  placeholders: {
    client: string;
    status: string;
  };
  data: {
    clientId: string;
    clientName: string;
    clientStatus: string;
  };
}

export interface PaidToClientPayload extends ActivityPayload {
  data: {
    paidAmount: number;
    batchAmount: number;
    accountLastDigits: number;
  };
}

export interface PossibleDuplicateActivityPayload extends ActivityPayload {
  placeholders: {
    loadNumber: string;
    possibleDuplicates: string;
  };
  data: {
    invoice: {
      id: string;
      loadNumber: string;
    };
    duplicates: {
      id: string;
      loadNumber: string;
      totalWeight: number;
      weights: {
        ruleName: string;
        ruleWeight: number;
      }[];
    }[];
  };
}

export interface NoBrokerDeliveryOptionsActivityPayload
  extends ActivityPayload {
  placeholders: {
    broker: string;
  };
  data: {
    broker: {
      id: string;
      name: string;
    };
  };
}

export interface BrokerClaimActivityPayload extends ActivityPayload {
  data: {
    brokerPaymentId: string | null;
    invoice: {
      status: InvoiceStatus;
    };
    contactPerson?: string;
    contactType?: string;
  };
}

export interface RateIncorrectActivityPayload extends ActivityPayload {
  data: {
    lineHaulRate: number;
    invoice: {
      status: InvoiceStatus;
    };
  };
}

export interface DuplicateInvoiceActivityPayload extends ActivityPayload {
  data: {
    invoiceStatus: InvoiceStatus;
  };
}

export interface ClientNeedsToContactBrokerActivityPayload
  extends ActivityPayload {
  data: {
    brokerContact: string;
    phoneNumber: string;
    invoiceStatus: InvoiceStatus;
  };
}

export interface BrokerSentPaymentViaECheckActivityPayload
  extends ActivityPayload {
  data: {
    checkNumber: string;
    paidDate: string;
  };
}

export interface ClientBrokerAssignmentActivityPayload extends ActivityPayload {
  placeholders: {
    client: string;
    broker: string;
  };
  data: {
    client: {
      id: string;
    };
    broker: {
      id: string;
    };
  };
}

export interface DocumentsActivityPayload extends ActivityPayload {
  placeholders: {
    names: string;
  };
  data: {
    documents: string[];
  };
}

export interface BrokerCancelledLoadPayload extends ActivityPayload {
  data: {
    cancellationDate: string;
    invoice: {
      status: InvoiceStatus;
    };
  };
}

export interface WaitingForBrokerVerificationActivityPayload
  extends ActivityPayload {
  data: {
    contactPerson: string;
    contactType: string;
    status: VerificationStatus;
  };
}

export interface MissingDocumentActivityPayload extends ActivityPayload {
  data: {
    missing: string;
    contactPerson: string;
    contactType: string;
    invoiceStatus: InvoiceStatus;
  };
}

export interface BrokerPaymentScheduledActivityPayload extends ActivityPayload {
  data: {
    checkNumberOrACH: string;
    contactPerson: string;
    contactType: string;
    invoiceStatus: InvoiceStatus;
    paymentIssueDate: string;
  };
}

export interface BrokerPaidClientDirectlyActivityPayload
  extends ActivityPayload {
  data: {
    checkNumberOrACH: string;
    contactPerson: string;
    contactType: string;
    invoiceStatus: InvoiceStatus;
  };
}

export interface BrokerPaidToDifferentInvoiceActivityPayload
  extends ActivityPayload {
  data: {
    checkNumber: string;
    date: string;
    loadNumber: string;
  };
}

export interface EmailSentActivityPayload extends ActivityPayload {
  data: {
    emails: string[];
  };
}

export interface ProcessingActivityPayload extends ActivityPayload {
  data: {
    contactPerson: string;
    contactType: string;
    invoiceStatus: InvoiceStatus;
  };
}
