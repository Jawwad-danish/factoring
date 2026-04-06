import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { VerifyRtpSupportQuery } from '../verify-rtp-support.query';
import { RtpSupportService } from '../../services/rtp-support.service';

@QueryHandler(VerifyRtpSupportQuery)
export class VerifyRtpSupportQueryHandler
  implements IQueryHandler<VerifyRtpSupportQuery>
{
  constructor(private readonly rtpSupportService: RtpSupportService) {}

  async execute(query: VerifyRtpSupportQuery): Promise<string[]> {
    const { accounts } = query;

    return this.rtpSupportService.verifyAccounts(accounts);
  }
}
