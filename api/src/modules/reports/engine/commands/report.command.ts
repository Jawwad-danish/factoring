import { BaseReportCreateRequest } from '@fs-bobtail/factoring/data';
import { Command } from '@module-cqrs';
import { Readable } from 'stream';

export abstract class ReportCommand<
  REQUEST extends BaseReportCreateRequest<REQUEST>,
> extends Command<Readable> {
  constructor(readonly request: REQUEST, readonly humanReadableName: string) {
    super();
  }
}
