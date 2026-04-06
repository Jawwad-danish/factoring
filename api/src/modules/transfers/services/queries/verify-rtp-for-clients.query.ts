import { Query } from '@module-cqrs';

export class VerifyRtpForClientsQuery extends Query<string[]> {
  constructor(readonly clientIds: string[]) {
    super();
  }
}
