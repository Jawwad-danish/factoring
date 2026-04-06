import { Client } from '@module-clients';
import { InvoiceEntity } from '@module-persistence/entities';

export interface VerificationCheckResult {
  note: string;
  payload: {
    cause: string;
  } & Record<string, any>;
}

export interface VerificationEngineInput {
  invoice: InvoiceEntity;
  client: Client;
  forceRun?: boolean;
}

export interface VerificationRequiredCheck {
  run(input: VerificationEngineInput): Promise<null | VerificationCheckResult>;
}
