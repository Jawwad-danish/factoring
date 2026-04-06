import { VerificationCheckResult } from '../verification-engine.types';

export const buildCheckResult = (
  note: string,
  cause: string,
  payloadBody: object,
): VerificationCheckResult => {
  return {
    note: note,
    payload: {
      cause: cause,
      ...payloadBody,
    },
  };
};
